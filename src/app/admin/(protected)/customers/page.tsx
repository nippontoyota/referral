import Link from "next/link";

import { CustomerList } from "@/components/admin/CustomerList";
import { CustomerUpload } from "@/components/admin/CustomerUpload";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 50;

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const page = Math.max(1, Number(params.page) || 1);
  const where = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" as const } },
          { phone: { contains: query } },
        ],
      }
    : {};

  const [total, customers, lastImport, activeSend] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        phone: true,
        referralToken: true,
        createdAt: true,
      },
    }),
    prisma.customerImport.findFirst({
      orderBy: { createdAt: "desc" },
      select: {
        filename: true,
        acceptedCount: true,
        rejectedCount: true,
        createdAt: true,
      },
    }),
    prisma.sendJob.findFirst({
      where: { status: { in: ["pending", "running"] } },
      select: { id: true },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-12 md:gap-16">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-ink)] md:text-4xl">
          Customers
        </h1>
        <p className="mt-2 text-base text-[var(--color-charcoal)]">
          Replace the active customer list with CSV/Excel upload, then search
          who will receive referral links.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-12">
        <Card>
          <h2 className="text-xl font-bold text-[var(--color-ink)]">Import</h2>
          <p className="mt-2 text-sm text-[var(--color-charcoal)]">
            Upload replaces all active customers. Matching phones keep their
            referral tokens.
          </p>
          <div className="mt-6">
            <CustomerUpload
              importBlocked={Boolean(activeSend)}
              lastImport={
                lastImport
                  ? {
                      ...lastImport,
                      createdAt: lastImport.createdAt.toISOString(),
                    }
                  : null
              }
            />
          </div>
        </Card>

        <section>
          <h2 className="text-xl font-bold text-[var(--color-ink)]">
            Active list
          </h2>
          <p className="mt-2 text-sm text-[var(--color-charcoal)]">
            {total.toLocaleString()} customer{total === 1 ? "" : "s"}
            {query ? ` matching “${query}”` : ""}
          </p>
          <div className="mt-6">
            <CustomerList
              query={query}
              page={page}
              total={total}
              totalPages={totalPages}
              customers={customers.map((customer) => ({
                ...customer,
                createdAt: customer.createdAt.toISOString(),
              }))}
            />
          </div>
          {totalPages > 1 ? (
            <div className="mt-6 flex items-center justify-between gap-3 text-sm">
              {page > 1 ? (
                <Link
                  href={`/admin/customers?q=${encodeURIComponent(query)}&page=${page - 1}`}
                  className="font-bold text-[var(--color-toyota-red)]"
                >
                  Previous
                </Link>
              ) : (
                <span />
              )}
              <span className="text-[var(--color-charcoal)]">
                Page {page} of {totalPages}
              </span>
              {page < totalPages ? (
                <Link
                  href={`/admin/customers?q=${encodeURIComponent(query)}&page=${page + 1}`}
                  className="font-bold text-[var(--color-toyota-red)]"
                >
                  Next
                </Link>
              ) : (
                <span />
              )}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
