"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { StatusPill } from "@/components/ui/status-pill";

export type CustomerListItem = {
  id: string;
  name: string;
  phone: string;
  referralToken: string;
  createdAt: string;
};

export function CustomerList({
  customers,
  query,
  page,
  total,
  totalPages,
}: {
  customers: CustomerListItem[];
  query: string;
  page: number;
  total: number;
  totalPages: number;
}) {
  const router = useRouter();
  const [value, setValue] = useState(query);
  const [pending, startTransition] = useTransition();

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const next = value.trim();
    startTransition(() => {
      const params = new URLSearchParams();
      if (next) params.set("q", next);
      params.set("page", "1");
      router.push(`/admin/customers?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={submitSearch} className="flex flex-col gap-1.5">
        <label
          htmlFor="customer-search"
          className="text-xs font-bold uppercase tracking-wide text-[var(--color-charcoal)]"
        >
          Search customers
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="customer-search"
            type="search"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Name or phone"
            className="min-h-11 w-full rounded-[var(--radius-inputs)] border border-[var(--color-hairline)] bg-[var(--color-pearl)] px-4 text-base text-[var(--color-ink)] placeholder:text-[var(--color-smoke)]"
          />
          <button
            type="submit"
            disabled={pending}
            className="min-h-11 rounded-[var(--radius-pill)] bg-[var(--color-toyota-red)] px-5 text-sm font-bold text-white disabled:opacity-60"
          >
            {pending ? "Searching…" : "Search"}
          </button>
        </div>
      </form>

      <p className="text-sm text-[var(--color-charcoal)]">
        Showing {customers.length} of {total.toLocaleString()}
        {totalPages > 1 ? ` · page ${page}/${totalPages}` : ""}
      </p>

      {customers.length === 0 ? (
        <p className="rounded-[var(--radius-cards)] border border-[var(--color-hairline)] bg-[var(--color-white)] p-6 text-sm text-[var(--color-charcoal)]">
          No customers match this search.
        </p>
      ) : (
        <>
          <ul className="flex flex-col gap-3 md:hidden">
            {customers.map((customer) => (
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
                {customers.map((customer, index) => (
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
