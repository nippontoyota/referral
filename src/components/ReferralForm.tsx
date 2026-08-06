"use client";

import type { InputHTMLAttributes } from "react";
import { useActionState, useState } from "react";

import { submitReferral, type ReferralResult } from "@/app/actions/referral";

const buttonClass =
  "inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-pill)] bg-[var(--color-toyota-red)] px-6 text-sm font-bold text-white hover:bg-[var(--color-toyota-red-dark)] disabled:opacity-60";

const shellClass =
  "w-full max-w-[560px] rounded-3xl border border-[var(--color-hairline)] bg-[var(--color-white)] p-6 md:rounded-[var(--radius-hero)] md:p-12";

const radioClass =
  "flex min-h-11 cursor-pointer items-center justify-center rounded-[var(--radius-pill)] border border-[var(--color-hairline)] px-4 py-3 text-sm font-bold capitalize text-[var(--color-ink)] has-[:checked]:border-[var(--color-toyota-red)] has-[:checked]:text-[var(--color-toyota-red)]";

function Input({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const id = props.id ?? props.name;
  return (
    <label className="flex flex-col gap-1.5" htmlFor={id}>
      <span className="text-xs font-bold uppercase tracking-wide text-[var(--color-charcoal)]">
        {label}
      </span>
      <input
        {...props}
        id={id}
        className="min-h-11 w-full rounded-[var(--radius-inputs)] border border-[var(--color-hairline)] bg-[var(--color-pearl)] px-4 py-3 text-base text-[var(--color-ink)] placeholder:text-[var(--color-smoke)]"
      />
    </label>
  );
}

export function ReferralForm() {
  const [view, setView] = useState<"form" | "thanks">("form");
  const [formKey, setFormKey] = useState(0);
  const [customer, setCustomer] = useState({ name: "", phone: "" });

  const [state, formAction, pending] = useActionState(
    async (
      prev: ReferralResult | null,
      formData: FormData,
    ): Promise<ReferralResult> => {
      const result = await submitReferral(prev, formData);
      if (result.ok) {
        setCustomer({
          name: String(formData.get("customerName") ?? "").trim(),
          phone: String(formData.get("customerPhone") ?? "").trim(),
        });
        setView("thanks");
      }
      return result;
    },
    null,
  );

  if (view === "thanks") {
    return (
      <div className={shellClass}>
        <div
          className="mb-6 flex h-12 w-12 items-center justify-center rounded-[var(--radius-pill)] text-xl font-bold text-white"
          style={{ background: "var(--color-gold)" }}
          aria-hidden
        >
          ✓
        </div>
        <h1 className="text-3xl font-bold text-[var(--color-ink)] md:text-5xl">
          Thank you
        </h1>
        <p className="mt-3 text-base text-[var(--color-charcoal)]">
          Your referral was submitted. Nippon Toyota will follow up with your
          friend.
        </p>
        <div className="mt-8">
          <button
            type="button"
            className={buttonClass}
            onClick={() => {
              setView("form");
              setFormKey((n) => n + 1);
            }}
          >
            Refer another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-toyota-red)]">
        Nippon Toyota
      </p>
      <h1 className="mt-3 text-3xl font-bold text-[var(--color-ink)] md:text-5xl">
        Refer a friend
      </h1>
      <p className="mt-3 text-base text-[var(--color-charcoal)]">
        Share your details and tell us who is interested in a Glanza or Hyryder.
      </p>

      <form
        key={formKey}
        action={formAction}
        className="mt-8 flex flex-col gap-5"
      >
        <div className="honeypot" aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input
            id="website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <Input
          label="Your name"
          name="customerName"
          required
          minLength={2}
          maxLength={100}
          autoComplete="name"
          defaultValue={customer.name}
        />
        <Input
          label="Your mobile"
          name="customerPhone"
          required
          inputMode="tel"
          autoComplete="tel"
          placeholder="10-digit Indian mobile"
          defaultValue={customer.phone}
        />
        <Input
          label="Person you are referring"
          name="referredName"
          required
          minLength={2}
          maxLength={100}
          autoComplete="off"
        />
        <Input
          label="Their mobile"
          name="referredPhone"
          required
          inputMode="tel"
          autoComplete="off"
          placeholder="10-digit Indian mobile"
        />

        <fieldset>
          <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--color-charcoal)]">
            Interested model
          </legend>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {(["glanza", "hyryder"] as const).map((value) => (
              <label key={value} className={radioClass}>
                <input
                  type="radio"
                  name="model"
                  value={value}
                  required
                  className="sr-only"
                />
                {value}
              </label>
            ))}
          </div>
        </fieldset>

        {state && !state.ok ? (
          <p className="text-sm text-[var(--color-danger)]" role="alert">
            {state.error}
          </p>
        ) : null}

        <button type="submit" className={buttonClass} disabled={pending}>
          {pending ? "Submitting…" : "Submit referral"}
        </button>
      </form>
    </div>
  );
}
