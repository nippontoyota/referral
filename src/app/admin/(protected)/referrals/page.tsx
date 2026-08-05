import { ReferralList } from "@/components/admin/ReferralList";
import { ReferralStats } from "@/components/admin/ReferralStats";
import { prisma } from "@/lib/prisma";

export default async function ReferralsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; model?: string }>;
}) {
  const params = await searchParams;
  const initialQuery = params.q?.trim() ?? "";
  const initialModel =
    params.model === "glanza" || params.model === "hyryder"
      ? params.model
      : "all";

  const [referrals, total, glanza, hyryder, duplicates] = await Promise.all([
    prisma.referral.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        referrerName: true,
        referrerPhone: true,
        referredName: true,
        referredPhone: true,
        model: true,
        isDuplicate: true,
        duplicateCount: true,
        createdAt: true,
      },
    }),
    prisma.referral.count(),
    prisma.referral.count({ where: { model: "glanza" } }),
    prisma.referral.count({ where: { model: "hyryder" } }),
    prisma.referral.count({ where: { isDuplicate: true } }),
  ]);

  return (
    <div className="flex flex-col gap-12 md:gap-16">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-ink)] md:text-4xl">
          Referrals
        </h1>
        <p className="mt-2 text-base text-[var(--color-charcoal)]">
          Track Glanza and Hyryder leads submitted from personalized links.
        </p>
      </div>

      <ReferralStats
        total={total}
        glanza={glanza}
        hyryder={hyryder}
        duplicates={duplicates}
      />

      <ReferralList
        initialQuery={initialQuery}
        initialModel={initialModel}
        referrals={referrals.map((referral) => ({
          ...referral,
          createdAt: referral.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
