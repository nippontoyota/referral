"use client";

import { useMemo, useState } from "react";

import { StatusPill } from "@/components/ui/status-pill";

export type ReferralListItem = {
  id: string;
  referrerName: string;
  referrerPhone: string;
  referredName: string;
  referredPhone: string;
  model: "glanza" | "hyryder";
  isDuplicate: boolean;
  duplicateCount: number;
  createdAt: string;
};

export function ReferralList({
  referrals,
  initialQuery = "",
  initialModel = "all",
}: {
  referrals: ReferralListItem[];
  initialQuery?: string;
  initialModel?: "all" | "glanza" | "hyryder";
}) {
  const [query, setQuery] = useState(initialQuery);
  const [model, setModel] = useState<"all" | "glanza" | "hyryder">(initialModel);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return referrals.filter((referral) => {
      if (model !== "all" && referral.model !== model) return false;
      if (!q) return true;
      return (
        referral.referredName.toLowerCase().includes(q) ||
        referral.referredPhone.toLowerCase().includes(q) ||
        referral.referrerName.toLowerCase().includes(q) ||
        referral.referrerPhone.toLowerCase().includes(q)
      );
    });
  }, [referrals, query, model]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <label className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wide text-[var(--color-charcoal)]">
            Search
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name or phone"
            className="min-h-11 w-full rounded-[var(--radius-inputs)] border border-[var(--color-hairline)] bg-[var(--color-pearl)] px-4 text-base"
          />
        </label>
        <label className="flex flex-col gap-1.5 md:w-48">
          <span className="text-xs font-bold uppercase tracking-wide text-[var(--color-charcoal)]">
            Model
          </span>
          <select
            value={model}
            onChange={(event) =>
              setModel(event.target.value as "all" | "glanza" | "hyryder")
            }
            className="min-h-11 w-full rounded-[var(--radius-inputs)] border border-[var(--color-hairline)] bg-[var(--color-pearl)] px-4 text-base"
          >
            <option value="all">All models</option>
            <option value="glanza">Glanza</option>
            <option value="hyryder">Hyryder</option>
          </select>
        </label>
        <a
          href="/api/admin/referrals/export"
          className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-pill)] border border-[var(--color-ink)] px-6 text-sm font-bold text-[var(--color-ink)] hover:bg-[var(--color-pearl)]"
        >
          Export CSV
        </a>
      </div>

      <p className="text-sm text-[var(--color-charcoal)]">
        Showing {filtered.length} of {referrals.length}
      </p>

      {filtered.length === 0 ? (
        <p className="rounded-[var(--radius-cards)] border border-[var(--color-hairline)] bg-[var(--color-white)] p-6 text-sm text-[var(--color-charcoal)]">
          No referrals match these filters.
        </p>
      ) : (
        <>
          <ul className="flex flex-col gap-3 md:hidden">
            {filtered.map((referral) => (
              <li
                key={referral.id}
                className="rounded-[var(--radius-cards)] border border-[var(--color-hairline)] bg-[var(--color-white)] p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-[var(--color-ink)]">
                    {referral.referredName}
                  </p>
                  <StatusPill>
                    {referral.model === "glanza" ? "Glanza" : "Hyryder"}
                  </StatusPill>
                  {referral.isDuplicate ? (
                    <StatusPill tone="warning">
                      Referred {referral.duplicateCount} times
                    </StatusPill>
                  ) : null}
                </div>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-[var(--color-smoke)]">Phone</dt>
                    <dd>{referral.referredPhone}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-[var(--color-smoke)]">Referrer</dt>
                    <dd className="text-right">
                      {referral.referrerName}
                      <br />
                      <span className="text-[var(--color-charcoal)]">
                        {referral.referrerPhone}
                      </span>
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-[var(--color-smoke)]">Submitted</dt>
                    <dd>{new Date(referral.createdAt).toLocaleString()}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[800px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-hairline)] text-[var(--color-smoke)]">
                  <th className="px-3 py-3 font-bold">Referred</th>
                  <th className="px-3 py-3 font-bold">Phone</th>
                  <th className="px-3 py-3 font-bold">Model</th>
                  <th className="px-3 py-3 font-bold">Referrer</th>
                  <th className="px-3 py-3 font-bold">Duplicate</th>
                  <th className="px-3 py-3 font-bold">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((referral, index) => (
                  <tr
                    key={referral.id}
                    className={
                      index % 2 === 0
                        ? "bg-[var(--color-white)]"
                        : "bg-[var(--color-pearl)]"
                    }
                  >
                    <td className="px-3 py-3 font-bold">
                      {referral.referredName}
                    </td>
                    <td className="px-3 py-3">{referral.referredPhone}</td>
                    <td className="px-3 py-3 capitalize">{referral.model}</td>
                    <td className="px-3 py-3">
                      <div>{referral.referrerName}</div>
                      <div className="text-[var(--color-charcoal)]">
                        {referral.referrerPhone}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {referral.isDuplicate ? (
                        <StatusPill tone="warning">
                          Referred {referral.duplicateCount} times
                        </StatusPill>
                      ) : (
                        <span className="text-[var(--color-smoke)]">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-[var(--color-charcoal)]">
                      {new Date(referral.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
