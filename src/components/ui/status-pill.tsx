import type { ReactNode } from "react";

type Tone = "success" | "warning" | "danger" | "neutral";

const tones: Record<Tone, string> = {
  success:
    "bg-[color-mix(in_srgb,var(--color-success)_12%,white)] text-[var(--color-success)]",
  warning:
    "bg-[color-mix(in_srgb,var(--color-warning)_14%,white)] text-[var(--color-warning)]",
  danger:
    "bg-[color-mix(in_srgb,var(--color-danger)_12%,white)] text-[var(--color-danger)]",
  neutral:
    "bg-[var(--color-pearl)] text-[var(--color-charcoal)]",
};

export function StatusPill({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <span
      className={[
        "inline-flex min-h-8 items-center rounded-[var(--radius-pill)] px-3 text-xs font-bold",
        tones[tone],
      ].join(" ")}
    >
      {children}
    </span>
  );
}
