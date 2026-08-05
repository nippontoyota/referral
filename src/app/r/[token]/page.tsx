import { notFound } from "next/navigation";

import { ReferralForm } from "@/components/forms/ReferralForm";
import { prisma } from "@/lib/prisma";

export default async function ReferralTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const customer = await prisma.customer.findUnique({
    where: { referralToken: token },
    select: { name: true, referralToken: true },
  });

  if (!customer) notFound();

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <ReferralForm
        token={customer.referralToken}
        referrerName={customer.name}
      />
    </main>
  );
}
