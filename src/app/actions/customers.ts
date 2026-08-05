"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { createReferralToken } from "@/lib/referral-token";
import { requireAdmin } from "@/lib/session";
import {
  validateCustomerCsv,
  type RejectedCustomerRow,
} from "@/schemas/customer-import";

export type CustomerImportResult = {
  accepted: number;
  rejected: RejectedCustomerRow[];
};

export async function importCustomers(
  formData: FormData,
): Promise<CustomerImportResult> {
  await requireAdmin();
  const file = formData.get("file");
  if (!file || typeof file === "string") throw new Error("Choose a CSV file");

  const parsed = validateCustomerCsv(await file.text());
  if (!parsed.accepted.length) {
    throw new Error("CSV has no valid customer rows");
  }

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('referral-send-import'))`;
    const active = await tx.sendJob.findFirst({
      where: { status: { in: ["pending", "running"] } },
      select: { id: true },
    });
    if (active) throw new Error("Import blocked while a send is in progress");

    const existing = await tx.customer.findMany({
      where: { phone: { in: parsed.accepted.map((row) => row.phone) } },
      select: { phone: true, referralToken: true },
    });
    const tokens = new Map(
      existing.map((customer) => [customer.phone, customer.referralToken]),
    );

    await tx.customer.deleteMany();
    await tx.customer.createMany({
      data: parsed.accepted.map((row) => ({
        ...row,
        referralToken: tokens.get(row.phone) ?? createReferralToken(),
      })),
    });
    await tx.customerImport.create({
      data: {
        filename: file.name || "customers.csv",
        acceptedCount: parsed.accepted.length,
        rejectedCount: parsed.rejected.length,
        status: "completed",
      },
    });
  });

  revalidatePath("/admin/customers");
  revalidatePath("/admin/send");
  return { accepted: parsed.accepted.length, rejected: parsed.rejected };
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
