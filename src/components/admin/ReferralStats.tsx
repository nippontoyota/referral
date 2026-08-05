export function ReferralStats({
  total,
  glanza,
  hyryder,
  duplicates,
}: {
  total: number;
  glanza: number;
  hyryder: number;
  duplicates: number;
}) {
  const items = [
    { label: "Total", value: total },
    { label: "Glanza", value: glanza },
    { label: "Hyryder", value: hyryder },
    { label: "Duplicates", value: duplicates },
  ];

  return (
    <dl className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-xs font-bold uppercase tracking-wide text-[var(--color-smoke)]">
            {item.label}
          </dt>
          <dd className="mt-1 text-3xl font-bold text-[var(--color-ink)] md:text-4xl">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
