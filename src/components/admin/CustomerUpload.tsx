"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";

import { clearTestData } from "@/app/actions/customers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseCsv } from "@/lib/csv";
import {
  validateCustomerMatrix,
  type RejectedCustomerRow,
} from "@/schemas/customer-import";

type ImportState = {
  error?: string;
  accepted?: number;
  rejectedCount?: number;
  rejected?: RejectedCustomerRow[];
  progress?: string;
} | null;

type ClearState = { error?: string; ok?: boolean } | null;

const CHUNK = 2_000;

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

async function readMatrix(file: File): Promise<unknown[][]> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv") || file.type === "text/csv") {
    return parseCsv(await file.text());
  }

  const workbook = XLSX.read(await file.arrayBuffer(), {
    type: "array",
    raw: true,
  });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) throw new Error("Workbook has no sheets");
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    blankrows: false,
    raw: true,
  });
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
  const router = useRouter();
  const [importState, setImportState] = useState<ImportState>(null);
  const [importPending, setImportPending] = useState(false);
  const [clearState, clearFormAction, clearPending] = useActionState(
    clearAction,
    null,
  );
  const [clearOpen, setClearOpen] = useState(false);
  const [clearSession, setClearSession] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
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
    importState?.rejectedCount ?? lastImport?.rejectedCount;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = new FormData(form).get("file");
    if (!file || typeof file === "string") {
      setImportState({ error: "Choose a CSV or Excel file" });
      return;
    }

    setImportPending(true);
    setImportState({ progress: "Reading spreadsheet…" });

    try {
      const matrix = await readMatrix(file);
      setImportState({
        progress: `Validating ${matrix.length.toLocaleString()} rows…`,
      });
      const parsed = validateCustomerMatrix(matrix);
      if (!parsed.accepted.length) {
        throw new Error("File has no valid customer rows");
      }

      setImportState({
        progress: "Preparing replace…",
      });
      const beginRes = await fetch("/api/admin/customers/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: "begin",
          filename: file.name,
          totalAccepted: parsed.accepted.length,
          rejectedCount: parsed.rejected.length,
        }),
      });
      const beginPayload = (await beginRes.json()) as {
        error?: string;
        tokens?: Record<string, string>;
      };
      if (!beginRes.ok) {
        throw new Error(beginPayload.error || "Could not start import");
      }

      const tokens = beginPayload.tokens ?? {};
      for (let offset = 0; offset < parsed.accepted.length; offset += CHUNK) {
        const slice = parsed.accepted.slice(offset, offset + CHUNK);
        setImportState({
          progress: `Importing ${Math.min(offset + CHUNK, parsed.accepted.length).toLocaleString()} / ${parsed.accepted.length.toLocaleString()}…`,
        });
        const chunkRes = await fetch("/api/admin/customers/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phase: "chunk",
            rows: slice.map((row) => ({
              ...row,
              referralToken: tokens[row.phone],
            })),
          }),
        });
        const chunkPayload = (await chunkRes.json()) as { error?: string };
        if (!chunkRes.ok) {
          throw new Error(chunkPayload.error || "Chunk import failed");
        }
      }

      const finishRes = await fetch("/api/admin/customers/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: "finish",
          filename: file.name,
          accepted: parsed.accepted.length,
          rejectedCount: parsed.rejected.length,
        }),
      });
      const finishPayload = (await finishRes.json()) as { error?: string };
      if (!finishRes.ok) {
        throw new Error(finishPayload.error || "Could not finalize import");
      }

      setImportState({
        accepted: parsed.accepted.length,
        rejectedCount: parsed.rejected.length,
        rejected: parsed.rejected.slice(0, 100),
      });
      form.reset();
      setFileName(null);
      router.refresh();
    } catch (error) {
      setImportState({
        error: error instanceof Error ? error.message : "Import failed",
      });
    } finally {
      setImportPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label
          htmlFor="customer-file"
          className="flex min-h-32 w-full cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-[var(--color-hairline)] bg-[var(--color-pearl)] px-4 py-8 text-center rounded-[var(--radius-cards)]"
        >
          <span className="text-sm font-bold text-[var(--color-ink)]">
            Upload customer CSV / Excel
          </span>
          <span className="text-sm text-[var(--color-charcoal)]">
            Accepts .xlsx / .xls / .csv (e.g. CUSTOMER NAME + CUSTOMER NO.).
            Handles 65k+ rows with chunked import.
          </span>
          <input
            id="customer-file"
            name="file"
            type="file"
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            required
            disabled={importBlocked || importPending}
            onChange={(event) =>
              setFileName(event.target.files?.[0]?.name ?? null)
            }
            className="mt-2 w-full max-w-full text-sm text-[var(--color-charcoal)] file:mr-3 file:min-h-11 file:rounded-[var(--radius-pill)] file:border-0 file:bg-[var(--color-white)] file:px-4 file:font-bold file:text-[var(--color-ink)]"
          />
          {fileName ? (
            <span className="text-xs text-[var(--color-smoke)]">{fileName}</span>
          ) : null}
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

        {importPending && importState?.progress ? (
          <p className="text-sm text-[var(--color-charcoal)]" role="status">
            {importState.progress}
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
              {(importState.rejectedCount ?? 0) > importState.rejected.length ? (
                <li>
                  …and{" "}
                  {(importState.rejectedCount ?? 0) -
                    importState.rejected.length}{" "}
                  more
                </li>
              ) : null}
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
