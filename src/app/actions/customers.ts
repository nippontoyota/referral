"use server";

import { revalidatePath } from "next/cache";

import { parseCustomerUpload } from "@/lib/customer-file";
import { prisma } from "@/lib/prisma";
import { createDirectPrisma } from "@/lib/prisma-direct";
import { createReferralToken } from "@/lib/referral-token";
import { requireAdmin } from "@/lib/session";
import type {
  CustomerImportRow,
  RejectedCustomerRow,
} from "@/schemas/customer-import";

export type CustomerImportResult = {
  accepted: number;
  rejectedCount: number;
  rejected: RejectedCustomerRow[];
};

const BATCH = 2_000;
const REJECT_PREVIEW = 100;

export async function replaceCustomers(
  rows: CustomerImportRow[],
  rejected: RejectedCustomerRow[],
  filename: string,
): Promise<CustomerImportResult> {
  await requireAdmin();
  if (!rows.length) throw new Error("File has no valid customer rows");

  const active = await prisma.sendJob.findFirst({
    where: { status: { in: ["pending", "running"] } },
    select: { id: true },
  });
  if (active) throw new Error("Import blocked while a send is in progress");

  const db = createDirectPrisma();
  try {
    await db.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('referral-send-import'))`;

        const existing = await tx.customer.findMany({
          select: { phone: true, referralToken: true },
        });
        const tokens = new Map(
          existing.map((customer) => [customer.phone, customer.referralToken]),
        );

        await tx.customer.deleteMany();

        for (let offset = 0; offset < rows.length; offset += BATCH) {
          const chunk = rows.slice(offset, offset + BATCH);
          await tx.customer.createMany({
            data: chunk.map((row) => ({
              name: row.name,
              phone: row.phone,
              referralToken: tokens.get(row.phone) ?? createReferralToken(),
            })),
          });
        }

        await tx.customerImport.create({
          data: {
            filename,
            acceptedCount: rows.length,
            rejectedCount: rejected.length,
            status: "completed",
          },
        });
      },
      { maxWait: 20_000, timeout: 300_000 },
    );
  } finally {
    await db.$disconnect();
  }

  revalidatePath("/admin/customers");
  revalidatePath("/admin/send");
  return {
    accepted: rows.length,
    rejectedCount: rejected.length,
    rejected: rejected.slice(0, REJECT_PREVIEW),
  };
}

export async function importCustomers(
  formData: FormData,
): Promise<CustomerImportResult> {
  await requireAdmin();
  const file = formData.get("file");
  if (!file || typeof file === "string") {
    throw new Error("Choose a CSV or Excel file");
  }

  const parsed = await parseCustomerUpload(file);
  return replaceCustomers(
    parsed.accepted,
    parsed.rejected,
    file.name || "customers",
  );
}

export async function clearTestData(
  confirmation: string | FormData,
): Promise<void> {
  await requireAdmin();
  const password =
    typeof confirmation === "string"
      ? confirmation
      : String(confirmation.get("password") ?? "");
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    throw new Error("Password confirmation failed");
  }

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('referral-send-import'))`;
    await tx.referral.deleteMany();
    await tx.sendMessage.deleteMany();
    await tx.sendJob.deleteMany();
    await tx.customerImport.deleteMany();
    await tx.customer.deleteMany();
  });

  revalidatePath("/admin/customers");
  revalidatePath("/admin/send");
  revalidatePath("/admin/referrals");
}
