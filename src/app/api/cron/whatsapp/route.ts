import { isTransientError, sendReferralInvite } from "@/lib/doubletick";
import { prisma } from "@/lib/prisma";

const BATCH_SIZE = 20;
const MAX_ATTEMPTS = 3;

type ClaimedMessage = {
  id: string;
  phone: string;
  attempts: number;
  name: string | null;
  referral_token: string | null;
};

const delay = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

function errorMessage(error: unknown): string {
  return (error instanceof Error ? error.message : "Unknown send error").slice(
    0,
    500,
  );
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (
    !secret ||
    request.headers.get("authorization") !== `Bearer ${secret}`
  ) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await prisma.$transaction(
    async (tx) => {
      const job =
        (await tx.sendJob.findFirst({
          where: { status: "running" },
          orderBy: { createdAt: "asc" },
        })) ??
        (await tx.sendJob.findFirst({
          where: { status: "pending" },
          orderBy: { createdAt: "asc" },
        }));
      if (!job) return { processed: 0, completed: false };

      if (job.status === "pending") {
        await tx.sendJob.update({
          where: { id: job.id },
          data: { status: "running", startedAt: job.startedAt ?? new Date() },
        });
      }

      const messages = await tx.$queryRaw<ClaimedMessage[]>`
        SELECT sm.id, sm.phone, sm.attempts, c.name, c.referral_token
        FROM send_messages sm
        LEFT JOIN customers c ON c.id = sm.customer_id
        WHERE sm.job_id = ${job.id}
          AND sm.status = 'pending'
        ORDER BY sm.created_at
        LIMIT ${BATCH_SIZE}
        FOR UPDATE OF sm SKIP LOCKED
      `;

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
      for (let index = 0; index < messages.length; index += 1) {
        if (index) await delay(50);
        const message = messages[index];
        const attempts = message.attempts + 1;

        if (!message.name || !message.referral_token || !baseUrl) {
          await tx.sendMessage.update({
            where: { id: message.id },
            data: {
              status: "failed",
              attempts,
              lastError: !baseUrl
                ? "NEXT_PUBLIC_APP_URL is not configured"
                : "Customer no longer exists",
            },
          });
          continue;
        }

        try {
          await sendReferralInvite(
            message.phone,
            message.name,
            `${baseUrl}/r/${message.referral_token}`,
          );
          await tx.sendMessage.update({
            where: { id: message.id },
            data: {
              status: "sent",
              attempts,
              lastError: null,
              sentAt: new Date(),
            },
          });
        } catch (error) {
          const retry = isTransientError(error) && attempts < MAX_ATTEMPTS;
          await tx.sendMessage.update({
            where: { id: message.id },
            data: {
              status: retry ? "pending" : "failed",
              attempts,
              lastError: errorMessage(error),
            },
          });
        }
      }

      const counts = await tx.sendMessage.groupBy({
        by: ["status"],
        where: { jobId: job.id },
        _count: { _all: true },
      });
      const count = Object.fromEntries(
        counts.map((item) => [item.status, item._count._all]),
      ) as Partial<Record<"pending" | "sent" | "failed", number>>;
      const pending = count.pending ?? 0;
      const completed = pending === 0;

      await tx.sendJob.update({
        where: { id: job.id },
        data: {
          status: completed ? "completed" : "running",
          sent: count.sent ?? 0,
          failed: count.failed ?? 0,
          completedAt: completed ? new Date() : null,
        },
      });

      return { processed: messages.length, completed };
    },
    { maxWait: 10_000, timeout: 120_000 },
  );

  return Response.json({ ok: true, ...result });
}
