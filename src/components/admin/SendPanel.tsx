"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { retryFailed, startSend } from "@/app/actions/send";
import { Button } from "@/components/ui/button";
import { BrandPanel } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";

export type SendJobView = {
  id: string;
  status: "pending" | "running" | "completed" | "failed";
  total: number;
  sent: number;
  failed: number;
  pending: number;
  startedAt: string | Date | null;
  completedAt: string | Date | null;
  createdAt: string | Date;
  messages: {
    id: string;
    phone: string;
    attempts: number;
    lastError: string | null;
  }[];
};

function jobTone(
  status: SendJobView["status"],
): "success" | "warning" | "danger" | "neutral" {
  if (status === "completed") return "success";
  if (status === "failed") return "danger";
  if (status === "running" || status === "pending") return "warning";
  return "neutral";
}

export function SendPanel({
  recipientCount,
  initialJob,
  hasPriorJob,
}: {
  recipientCount: number;
  initialJob: SendJobView | null;
  hasPriorJob: boolean;
}) {
  const router = useRouter();
  const [job, setJob] = useState(initialJob);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const active = job?.status === "pending" || job?.status === "running";

  useEffect(() => {
    setJob(initialJob);
  }, [initialJob]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (confirmOpen && !dialog.open) dialog.showModal();
    if (!confirmOpen && dialog.open) dialog.close();
  }, [confirmOpen]);

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      router.refresh();
    }, 2000);
    return () => window.clearInterval(id);
  }, [active, router]);

  function runStart(confirmed: boolean) {
    setError(null);
    startTransition(async () => {
      try {
        const formData = new FormData();
        if (confirmed) formData.set("confirm", "true");
        await startSend(confirmed ? formData : undefined);
        setConfirmOpen(false);
        router.refresh();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Could not start send";
        if (message.toLowerCase().includes("confirm")) {
          setConfirmOpen(true);
          setError(message);
          return;
        }
        setError(message);
      }
    });
  }

  function onStartClick() {
    if (hasPriorJob || (job && job.status === "completed")) {
      setConfirmOpen(true);
      return;
    }
    runStart(false);
  }

  function onRetry() {
    if (!job) return;
    setError(null);
    startTransition(async () => {
      try {
        await retryFailed(job.id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Retry failed");
      }
    });
  }

  const sent = job?.sent ?? 0;
  const failed = job?.failed ?? 0;
  const pendingCount =
    job?.pending ?? Math.max(recipientCount - sent - failed, 0);
  const total = job?.total || recipientCount || 1;
  const sentPct = Math.round((sent / total) * 100);
  const failedPct = Math.round((failed / total) * 100);
  const pendingPct = Math.max(0, 100 - sentPct - failedPct);

  return (
    <div className="flex flex-col gap-8">
      <BrandPanel>
        <p className="text-xs font-bold uppercase tracking-wide text-white/80">
          WhatsApp blast
        </p>
        <h1 className="mt-2 text-3xl font-bold md:text-4xl">Send referrals</h1>
        <p className="mt-3 max-w-xl text-sm text-white/90 md:text-base">
          Personalized links go out via the hardcoded DoubleTick template. Only
          one blast can run at a time.
        </p>
        <p className="mt-6 text-2xl font-bold">
          {recipientCount}{" "}
          <span className="text-base font-normal text-white/80">
            recipient{recipientCount === 1 ? "" : "s"}
          </span>
        </p>
      </BrandPanel>

      <div className="flex flex-col gap-3">
        <Button
          type="button"
          onClick={onStartClick}
          disabled={pending || active || recipientCount === 0}
          fullWidth
        >
          {active
            ? "Send in progress…"
            : recipientCount === 0
              ? "Import customers first"
              : "Start send"}
        </Button>
        {error ? (
          <p className="text-sm text-[var(--color-danger)]" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      {job ? (
        <section className="rounded-[var(--radius-cards)] border border-[var(--color-hairline)] bg-[var(--color-white)] p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-bold text-[var(--color-ink)]">
              Progress
            </h2>
            <StatusPill tone={jobTone(job.status)}>{job.status}</StatusPill>
            {active ? (
              <span className="text-xs text-[var(--color-smoke)]">
                Refreshing every 2s
              </span>
            ) : null}
          </div>

          <div
            className="mt-6 flex h-3 w-full overflow-hidden rounded-[var(--radius-pill)] bg-[var(--color-hairline)]"
            role="img"
            aria-label={`Sent ${sent}, failed ${failed}, pending ${pendingCount}`}
          >
            <span
              className="block h-full bg-[var(--color-success)]"
              style={{ width: `${sentPct}%` }}
            />
            <span
              className="block h-full bg-[var(--color-danger)]"
              style={{ width: `${failedPct}%` }}
            />
            <span
              className="block h-full bg-[var(--color-hairline)]"
              style={{ width: `${pendingPct}%` }}
            />
          </div>

          <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-[var(--radius-cards)] bg-[var(--color-pearl)] p-4">
              <dt className="text-xs uppercase tracking-wide text-[var(--color-smoke)]">
                Sent
              </dt>
              <dd className="text-2xl font-bold text-[var(--color-success)]">
                {sent}
              </dd>
            </div>
            <div className="rounded-[var(--radius-cards)] bg-[var(--color-pearl)] p-4">
              <dt className="text-xs uppercase tracking-wide text-[var(--color-smoke)]">
                Failed
              </dt>
              <dd className="text-2xl font-bold text-[var(--color-danger)]">
                {failed}
              </dd>
            </div>
            <div className="rounded-[var(--radius-cards)] bg-[var(--color-pearl)] p-4">
              <dt className="text-xs uppercase tracking-wide text-[var(--color-smoke)]">
                Pending
              </dt>
              <dd className="text-2xl font-bold text-[var(--color-charcoal)]">
                {pendingCount}
              </dd>
            </div>
          </dl>

          {job.status === "completed" && job.failed > 0 ? (
            <div className="mt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={onRetry}
                disabled={pending}
              >
                {pending ? "Retrying…" : "Retry failed"}
              </Button>
            </div>
          ) : null}

          {job.messages.length > 0 ? (
            <div className="mt-8">
              <h3 className="text-sm font-bold text-[var(--color-ink)]">
                Failed messages
              </h3>
              <ul className="mt-3 flex flex-col gap-3 md:hidden">
                {job.messages.map((message) => (
                  <li
                    key={message.id}
                    className="rounded-[var(--radius-cards)] border border-[var(--color-hairline)] bg-[var(--color-pearl)] p-4 text-sm"
                  >
                    <p className="font-bold text-[var(--color-ink)]">
                      {message.phone}
                    </p>
                    <p className="mt-2 text-[var(--color-danger)]">
                      {message.lastError ?? "Unknown error"}
                    </p>
                    <p className="mt-1 text-[var(--color-smoke)]">
                      Attempts: {message.attempts}
                    </p>
                  </li>
                ))}
              </ul>
              <div className="mt-3 hidden overflow-x-auto md:block">
                <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-hairline)] text-[var(--color-smoke)]">
                      <th className="px-3 py-3 font-bold">Phone</th>
                      <th className="px-3 py-3 font-bold">Attempts</th>
                      <th className="px-3 py-3 font-bold">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {job.messages.map((message, index) => (
                      <tr
                        key={message.id}
                        className={
                          index % 2 === 0
                            ? "bg-[var(--color-white)]"
                            : "bg-[var(--color-pearl)]"
                        }
                      >
                        <td className="px-3 py-3 font-bold">{message.phone}</td>
                        <td className="px-3 py-3">{message.attempts}</td>
                        <td className="px-3 py-3 text-[var(--color-danger)]">
                          {message.lastError ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <dialog
        ref={dialogRef}
        className="m-0 h-dvh w-dvw max-h-none max-w-none border-0 bg-[color-mix(in_srgb,var(--color-ink)_40%,transparent)] p-0 md:m-auto md:h-auto md:w-full md:max-w-md md:rounded-[var(--radius-cards)] md:bg-transparent md:p-4"
        onClose={() => setConfirmOpen(false)}
      >
        <div className="flex h-full flex-col justify-end bg-[var(--color-white)] p-6 md:h-auto md:rounded-[var(--radius-cards)] md:border md:border-[var(--color-hairline)] md:p-8">
          <h3 className="text-xl font-bold text-[var(--color-ink)]">
            Start another send?
          </h3>
          <p className="mt-2 text-sm text-[var(--color-charcoal)]">
            This will queue WhatsApp messages for all {recipientCount} current
            customers.
          </p>
          {error ? (
            <p className="mt-3 text-sm text-[var(--color-danger)]" role="alert">
              {error}
            </p>
          ) : null}
          <div className="mt-6 flex flex-col gap-3 md:flex-row">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => runStart(true)}
              disabled={pending}
            >
              {pending ? "Starting…" : "Confirm start"}
            </Button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
