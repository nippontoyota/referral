import { SendPanel, type SendJobView } from "@/components/admin/SendPanel";
import { prisma } from "@/lib/prisma";

async function loadJob(): Promise<SendJobView | null> {
  const select = {
    id: true,
    status: true,
    total: true,
    sent: true,
    failed: true,
    startedAt: true,
    completedAt: true,
    createdAt: true,
    messages: {
      where: { status: "failed" as const },
      take: 100,
      select: {
        id: true,
        phone: true,
        attempts: true,
        lastError: true,
      },
      orderBy: { createdAt: "asc" as const },
    },
  };

  const active = await prisma.sendJob.findFirst({
    where: { status: { in: ["pending", "running"] } },
    orderBy: { createdAt: "desc" },
    select,
  });
  const job =
    active ??
    (await prisma.sendJob.findFirst({
      orderBy: { createdAt: "desc" },
      select,
    }));

  if (!job) return null;
  return {
    ...job,
    pending: Math.max(job.total - job.sent - job.failed, 0),
    startedAt: job.startedAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
    createdAt: job.createdAt.toISOString(),
  };
}

export default async function SendPage() {
  const [recipientCount, initialJob, priorJobCount] = await Promise.all([
    prisma.customer.count(),
    loadJob(),
    prisma.sendJob.count(),
  ]);

  return (
    <SendPanel
      recipientCount={recipientCount}
      initialJob={initialJob}
      hasPriorJob={priorJobCount > 0}
    />
  );
}
