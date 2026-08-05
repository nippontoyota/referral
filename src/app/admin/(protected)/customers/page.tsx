import { CustomerList } from "@/components/admin/CustomerList";
import { CustomerUpload } from "@/components/admin/CustomerUpload";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export default async function CustomersPage() {
  const [customers, lastImport, activeSend] = await Promise.all([
    prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
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

  return (
    <div className="flex flex-col gap-12 md:gap-16">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-ink)] md:text-4xl">
          Customers
        </h1>
        <p className="mt-2 text-base text-[var(--color-charcoal)]">
          Replace the active customer list with a CSV upload, then review who
          will receive referral links.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-12">
        <Card>
          <h2 className="text-xl font-bold text-[var(--color-ink)]">
            Import
          </h2>
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
            {customers.length} customer{customers.length === 1 ? "" : "s"}
          </p>
          <div className="mt-6">
            <CustomerList
              customers={customers.map((customer) => ({
                ...customer,
                createdAt: customer.createdAt.toISOString(),
              }))}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
