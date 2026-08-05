"use client";

import { useMemo, useState } from "react";

import { StatusPill } from "@/components/ui/status-pill";

export type CustomerListItem = {
  id: string;
  name: string;
  phone: string;
  referralToken: string;
  createdAt: string;
};

export function CustomerList({ customers }: { customers: CustomerListItem[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(q) ||
        customer.phone.toLowerCase().includes(q),
    );
  }, [customers, query]);

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-bold uppercase tracking-wide text-[var(--color-charcoal)]">
          Search customers
        </span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Name or phone"
          className="min-h-11 w-full rounded-[var(--radius-inputs)] border border-[var(--color-hairline)] bg-[var(--color-pearl)] px-4 text-base text-[var(--color-ink)] placeholder:text-[var(--color-smoke)]"
        />
      </label>

      <p className="text-sm text-[var(--color-charcoal)]">
        Showing {filtered.length} of {customers.length}
      </p>

      {filtered.length === 0 ? (
        <p className="rounded-[var(--radius-cards)] border border-[var(--color-hairline)] bg-[var(--color-white)] p-6 text-sm text-[var(--color-charcoal)]">
          No customers match this search.
        </p>
      ) : (
        <>
          <ul className="flex flex-col gap-3 md:hidden">
            {filtered.map((customer) => (
              <li
                key={customer.id}
                className="rounded-[var(--radius-cards)] border border-[var(--color-hairline)] bg-[var(--color-white)] p-4"
              >
                <p className="font-bold text-[var(--color-ink)]">
                  {customer.name}
                </p>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-[var(--color-smoke)]">Phone</dt>
                    <dd className="text-right text-[var(--color-ink)]">
                      {customer.phone}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-[var(--color-smoke)]">Token</dt>
                    <dd className="max-w-[60%] truncate text-right text-[var(--color-charcoal)]">
                      {customer.referralToken}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-hairline)] text-[var(--color-smoke)]">
                  <th className="px-3 py-3 font-bold">Name</th>
                  <th className="px-3 py-3 font-bold">Phone</th>
                  <th className="px-3 py-3 font-bold">Token</th>
                  <th className="px-3 py-3 font-bold">Added</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer, index) => (
                  <tr
                    key={customer.id}
                    className={
                      index % 2 === 0
                        ? "bg-[var(--color-white)]"
                        : "bg-[var(--color-pearl)]"
                    }
                  >
                    <td className="px-3 py-3 font-bold text-[var(--color-ink)]">
                      {customer.name}
                    </td>
                    <td className="px-3 py-3 text-[var(--color-charcoal)]">
                      {customer.phone}
                    </td>
                    <td className="px-3 py-3">
                      <StatusPill>{customer.referralToken}</StatusPill>
                    </td>
                    <td className="px-3 py-3 text-[var(--color-charcoal)]">
                      {new Date(customer.createdAt).toLocaleDateString()}
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
