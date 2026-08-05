"use client";

import { useActionState } from "react";

import { login, type LoginState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    login,
    null,
  );

  return (
    <Card hero className="w-full max-w-[560px]">
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-toyota-red)]">
        Nippon Toyota
      </p>
      <h1 className="mt-3 text-3xl font-bold text-[var(--color-ink)] md:text-4xl">
        Admin login
      </h1>
      <p className="mt-3 text-base text-[var(--color-charcoal)]">
        Sign in to manage customers, sends, and referrals.
      </p>

      <form action={action} className="mt-8 flex flex-col gap-5">
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="username"
          required
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />

        {state?.error ? (
          <p className="text-sm text-[var(--color-danger)]" role="alert">
            {state.error}
          </p>
        ) : null}

        <Button type="submit" disabled={pending} fullWidth>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </Card>
  );
}
