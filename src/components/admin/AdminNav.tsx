"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { logout } from "@/app/actions/auth";

const links = [
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/send", label: "Send" },
  { href: "/admin/referrals", label: "Referrals" },
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-hairline)] bg-[var(--color-canvas)]">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-toyota-red)]">
            Nippon Toyota
          </p>
          <p className="truncate text-sm font-bold text-[var(--color-ink)]">
            Referral admin
          </p>
        </div>

        <nav
          className="hidden items-center gap-6 md:flex"
          aria-label="Admin"
        >
          {links.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={false}
                className={[
                  "inline-flex min-h-11 items-center border-b-2 text-sm font-bold transition-colors",
                  active
                    ? "border-[var(--color-toyota-red)] text-[var(--color-toyota-red)]"
                    : "border-transparent text-[var(--color-charcoal)] hover:text-[var(--color-ink)]",
                ].join(" ")}
              >
                {link.label}
              </Link>
            );
          })}
          <form action={logout}>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center text-sm font-bold text-[var(--color-charcoal)] hover:text-[var(--color-ink)]"
            >
              Logout
            </button>
          </form>
        </nav>

        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-pill)] border border-[var(--color-hairline)] text-sm font-bold text-[var(--color-ink)] md:hidden"
          aria-expanded={open}
          aria-controls="admin-mobile-menu"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open ? (
        <nav
          id="admin-mobile-menu"
          className="border-t border-[var(--color-hairline)] px-4 py-3 md:hidden"
          aria-label="Admin mobile"
        >
          <ul className="flex flex-col gap-1">
            {links.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    prefetch={false}
                    onClick={() => setOpen(false)}
                    className={[
                      "flex min-h-11 items-center rounded-[var(--radius-inputs)] px-3 text-sm font-bold",
                      active
                        ? "bg-[var(--color-pearl)] text-[var(--color-toyota-red)]"
                        : "text-[var(--color-ink)]",
                    ].join(" ")}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
            <li>
              <form action={logout}>
                <button
                  type="submit"
                  className="flex min-h-11 w-full items-center rounded-[var(--radius-inputs)] px-3 text-left text-sm font-bold text-[var(--color-charcoal)]"
                >
                  Logout
                </button>
              </form>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
