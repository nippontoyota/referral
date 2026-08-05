"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

function resendConfirmed(value?: boolean | FormData): boolean {
  if (typeof value === "boolean") return value;
  if (!value) return false;
  return ["true", "on", "yes"].includes(String(value.get("confirm") ?? ""));
}

export async function startSend(
  confirmation?: boolean | FormData,
): Promise<{ jobId: string }> {
  await requireAdmin();

  const job = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('referral-send-import'))`;
    const active = await tx.sendJob.findFirst({
      where: { status: { in: ["pending", "running"] } },
      select: { id: true },
    });
    if (active) throw new Error("A send is already in progress");

    const previous = await tx.sendJob.findFirst({ select: { id: true } });
    if (previous && !resendConfirmed(confirmation)) {
      throw new Error("Confirm before starting another send");
    }

    const customers = await tx.customer.findMany({
      select: { id: true, phone: true },
    });
    if (!customers.length) throw new Error("There are no customers to send to");

    const created = await tx.sendJob.create({
      data: { status: "pending", total: customers.length },
      select: { id: true },
    });
    await tx.sendMessage.createMany({
      data: customers.map((customer) => ({
        jobId: created.id,
        customerId: customer.id,
        phone: customer.phone,
      })),
    });
    return created;
  });

  revalidatePath("/admin/send");
  return { jobId: job.id };
}

export async function retryFailed(jobId?: string): Promise<void> {
  await requireAdmin();

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('referral-send-import'))`;
    const active = await tx.sendJob.findFirst({
      where: { status: { in: ["pending", "running"] } },
      select: { id: true },
    });
    if (active) throw new Error("A send is already in progress");

    const job = await tx.sendJob.findFirst({
      where: {
        ...(jobId ? { id: jobId } : {}),
        status: "completed",
        failed: { gt: 0 },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (!job) throw new Error("No completed send has failures to retry");

    await tx.sendMessage.updateMany({
      where: { jobId: job.id, status: "failed" },
      data: { status: "pending", attempts: 0, lastError: null, sentAt: null },
    });
    await tx.sendJob.update({
      where: { id: job.id },
      data: { status: "running", failed: 0, completedAt: null },
    });
  });

  revalidatePath("/admin/send");
}

export async function getActiveOrLatestJob() {
  await requireAdmin();
  const job = await prisma.sendJob.findFirst({
    orderBy: [
      { status: "asc" },
      { createdAt: "desc" },
    ],
    select: {
      id: true,
      status: true,
      total: true,
      sent: true,
      failed: true,
      startedAt: true,
      completedAt: true,
      createdAt: true,
      messages: {
        where: { status: "failed" },
        select: { id: true, phone: true, attempts: true, lastError: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return job ? { ...job, pending: job.total - job.sent - job.failed } : null;
}
