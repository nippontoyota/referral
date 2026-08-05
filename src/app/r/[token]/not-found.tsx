import { Card } from "@/components/ui/card";

export default function ReferralNotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <Card hero className="w-full max-w-[560px] text-center">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-toyota-red)]">
          Nippon Toyota
        </p>
        <h1 className="mt-3 text-3xl font-bold text-[var(--color-ink)]">
          Link not found
        </h1>
        <p className="mt-3 text-base text-[var(--color-charcoal)]">
          This referral link is invalid or no longer active. Ask Nippon Toyota
          for a new WhatsApp invite.
        </p>
      </Card>
    </main>
  );
}
