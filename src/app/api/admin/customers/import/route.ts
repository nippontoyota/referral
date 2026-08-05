import { prisma } from "@/lib/prisma";
import { createDirectPrisma } from "@/lib/prisma-direct";
import { createReferralToken } from "@/lib/referral-token";
import { isAuthenticated } from "@/lib/session";
import type { CustomerImportRow } from "@/schemas/customer-import";

export const runtime = "nodejs";
export const maxDuration = 60;

const BATCH = 2_000;

type Body =
  | {
      phase: "begin";
      filename: string;
      totalAccepted: number;
      rejectedCount: number;
    }
  | {
      phase: "chunk";
      rows: CustomerImportRow[];
    }
  | {
      phase: "finish";
      filename: string;
      accepted: number;
      rejectedCount: number;
    };

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Body;

  if (body.phase === "begin") {
    const active = await prisma.sendJob.findFirst({
      where: { status: { in: ["pending", "running"] } },
      select: { id: true },
    });
    if (active) {
      return Response.json(
        { error: "Import blocked while a send is in progress" },
        { status: 409 },
      );
    }

    const db = createDirectPrisma();
    try {
      const existing = await db.customer.findMany({
        select: { phone: true, referralToken: true },
      });
      await db.customer.deleteMany();
      return Response.json({
        ok: true,
        tokens: Object.fromEntries(
          existing.map((row) => [row.phone, row.referralToken]),
        ),
      });
    } finally {
      await db.$disconnect();
    }
  }

  if (body.phase === "chunk") {
    if (!Array.isArray(body.rows) || !body.rows.length) {
      return Response.json({ error: "Chunk is empty" }, { status: 400 });
    }
    if (body.rows.length > BATCH) {
      return Response.json(
        { error: `Chunk too large (max ${BATCH})` },
        { status: 400 },
      );
    }

    const db = createDirectPrisma();
    try {
      await db.customer.createMany({
        data: body.rows.map((row) => ({
          name: row.name,
          phone: row.phone,
          referralToken: row.referralToken || createReferralToken(),
        })),
        skipDuplicates: true,
      });
      return Response.json({ ok: true, inserted: body.rows.length });
    } finally {
      await db.$disconnect();
    }
  }

  if (body.phase === "finish") {
    await prisma.customerImport.create({
      data: {
        filename: body.filename || "customers",
        acceptedCount: body.accepted,
        rejectedCount: body.rejectedCount,
        status: "completed",
      },
    });
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Unknown phase" }, { status: 400 });
}
