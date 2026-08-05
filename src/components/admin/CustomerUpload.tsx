"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import {
  clearTestData,
  importCustomers,
  type CustomerImportResult,
} from "@/app/actions/customers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RejectedCustomerRow } from "@/schemas/customer-import";

type ImportState = {
  error?: string;
  accepted?: number;
  rejected?: RejectedCustomerRow[];
} | null;

type ClearState = { error?: string; ok?: boolean } | null;

async function importAction(
  _previous: ImportState,
  formData: FormData,
): Promise<ImportState> {
  try {
    const result: CustomerImportResult = await importCustomers(formData);
    return { accepted: result.accepted, rejected: result.rejected };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Import failed",
    };
  }
}

async function clearAction(
  _previous: ClearState,
  formData: FormData,
): Promise<ClearState> {
  try {
    await clearTestData(formData);
    return { ok: true };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not clear test data",
    };
  }
}

export function CustomerUpload({
  lastImport,
  importBlocked,
}: {
  lastImport: {
    filename: string;
    acceptedCount: number;
    rejectedCount: number;
    createdAt: string;
  } | null;
  importBlocked: boolean;
}) {
  const [importState, importFormAction, importPending] = useActionState(
    importAction,
    null,
  );
  const [clearState, clearFormAction, clearPending] = useActionState(
    clearAction,
    null,
  );
  const [clearOpen, setClearOpen] = useState(false);
  const [clearSession, setClearSession] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const dialogOpen = clearOpen && !clearState?.ok;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (dialogOpen && !dialog.open) dialog.showModal();
    if (!dialogOpen && dialog.open) dialog.close();
  }, [dialogOpen]);

  const summaryAccepted = importState?.accepted ?? lastImport?.acceptedCount;
  const summaryRejected =
    importState?.rejected?.length ?? lastImport?.rejectedCount;

  return (
    <div className="flex flex-col gap-8">
      <form action={importFormAction} className="flex flex-col gap-4">
        <label
          htmlFor="customer-csv"
          className="flex min-h-32 w-full cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-[var(--color-hairline)] bg-[var(--color-pearl)] px-4 py-8 text-center rounded-[var(--radius-cards)]"
        >
          <span className="text-sm font-bold text-[var(--color-ink)]">
            Upload customer CSV
          </span>
          <span className="text-sm text-[var(--color-charcoal)]">
            Columns: name, phone. Replaces the full active list.
          </span>
          <input
            id="customer-csv"
            name="file"
            type="file"
            accept=".csv,text/csv"
            required
            disabled={importBlocked || importPending}
            className="mt-2 w-full max-w-full text-sm text-[var(--color-charcoal)] file:mr-3 file:min-h-11 file:rounded-[var(--radius-pill)] file:border-0 file:bg-[var(--color-white)] file:px-4 file:font-bold file:text-[var(--color-ink)]"
          />
        </label>

        {importBlocked ? (
          <p className="text-sm text-[var(--color-warning)]" role="status">
            Import is blocked while a WhatsApp send is in progress.
          </p>
        ) : null}

        {importState?.error ? (
          <p className="text-sm text-[var(--color-danger)]" role="alert">
            {importState.error}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={importBlocked || importPending}
          fullWidth
        >
          {importPending ? "Importing…" : "Import customers"}
        </Button>
      </form>

      {(summaryAccepted != null || lastImport) && (
        <div className="rounded-[var(--radius-cards)] border border-[var(--color-hairline)] bg-[var(--color-pearl)] p-5">
          <h2 className="text-sm font-bold text-[var(--color-ink)]">
            Import summary
          </h2>
          <p className="mt-2 text-sm text-[var(--color-charcoal)]">
            {lastImport && !importState?.accepted
              ? `${lastImport.filename} · ${new Date(lastImport.createdAt).toLocaleString()}`
              : "Latest upload"}
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <dt className="text-xs uppercase tracking-wide text-[var(--color-smoke)]">
                Accepted
              </dt>
              <dd className="text-2xl font-bold text-[var(--color-success)]">
                {summaryAccepted ?? 0}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[var(--color-smoke)]">
                Rejected
              </dt>
              <dd className="text-2xl font-bold text-[var(--color-danger)]">
                {summaryRejected ?? 0}
              </dd>
            </div>
          </dl>

          {importState?.rejected && importState.rejected.length > 0 ? (
            <ul className="mt-4 max-h-48 space-y-2 overflow-y-auto text-sm text-[var(--color-danger)]">
              {importState.rejected.map((row) => (
                <li key={`${row.row}-${row.reason}`}>
                  Row {row.row}: {row.reason}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}

      <div className="border-t border-[var(--color-hairline)] pt-6">
        <h2 className="text-sm font-bold text-[var(--color-ink)]">
          Clear test data
        </h2>
        <p className="mt-2 text-sm text-[var(--color-charcoal)]">
          Deletes customers, imports, send jobs, and referrals. Use once before
          the first real upload.
        </p>
        <div className="mt-4">
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              setClearSession((value) => value + 1);
              setClearOpen(true);
            }}
          >
            Clear test data
          </Button>
        </div>
        {clearState?.error && !clearOpen ? (
          <p className="mt-3 text-sm text-[var(--color-danger)]" role="alert">
            {clearState.error}
          </p>
        ) : null}
        {clearState?.ok ? (
          <p className="mt-3 text-sm text-[var(--color-success)]" role="status">
            Test data cleared.
          </p>
        ) : null}
      </div>

      <dialog
        ref={dialogRef}
        className="m-0 h-dvh w-dvw max-h-none max-w-none border-0 bg-[color-mix(in_srgb,var(--color-ink)_40%,transparent)] p-0 md:m-auto md:h-auto md:w-full md:max-w-md md:rounded-[var(--radius-cards)] md:bg-transparent md:p-4"
        onClose={() => {
          setClearOpen(false);
        }}
      >
        <form
          key={clearSession}
          action={clearFormAction}
          className="flex h-full flex-col justify-end bg-[var(--color-white)] p-6 md:h-auto md:rounded-[var(--radius-cards)] md:border md:border-[var(--color-hairline)] md:p-8"
        >
          <h3 className="text-xl font-bold text-[var(--color-ink)]">
            Confirm clear test data
          </h3>
          <p className="mt-2 text-sm text-[var(--color-charcoal)]">
            Enter the admin password to permanently delete all test records.
          </p>
          <div className="mt-6">
            <Input
              label="Admin password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          {clearState?.error ? (
            <p className="mt-3 text-sm text-[var(--color-danger)]" role="alert">
              {clearState.error}
            </p>
          ) : null}
          <div className="mt-6 flex flex-col gap-3 md:flex-row">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setClearOpen(false)}
              disabled={clearPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive-solid"
              disabled={clearPending}
            >
              {clearPending ? "Clearing…" : "Delete everything"}
            </Button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
