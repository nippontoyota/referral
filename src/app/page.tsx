export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div
        className="w-full max-w-lg bg-white p-8 md:p-12"
        style={{ borderRadius: "var(--radius-hero)" }}
      >
        <p
          className="text-sm font-bold uppercase tracking-wide"
          style={{ color: "var(--color-toyota-red)" }}
        >
          Nippon Toyota
        </p>
        <h1
          className="mt-3 text-3xl font-bold md:text-5xl"
          style={{ color: "var(--color-ink)", lineHeight: 1.25 }}
        >
          Referral
        </h1>
        <p className="mt-4 text-base" style={{ color: "var(--color-charcoal)" }}>
          Customer referrals for Glanza and Hyryder. Admin and public form routes
          come next.
        </p>
        <a
          href="/admin/login"
          className="mt-8 inline-flex h-11 items-center justify-center px-7 text-sm font-bold text-white transition-colors"
          style={{
            background: "var(--color-toyota-red)",
            borderRadius: "var(--radius-pill)",
          }}
        >
          Admin login
        </a>
      </div>
    </main>
  );
}
