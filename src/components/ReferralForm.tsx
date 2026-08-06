"use client";

import type { InputHTMLAttributes } from "react";
import { useActionState, useState } from "react";

import { submitReferral, type ReferralResult } from "@/app/actions/referral";
import { MAX_FRIENDS } from "@/schemas/referral";

const primaryBtn =
  "btn-press inline-flex min-h-12 w-full items-center justify-center rounded-[var(--radius-pill)] bg-[var(--color-toyota-red)] px-6 text-[15px] font-semibold tracking-wide text-white hover:bg-[var(--color-toyota-red-dark)] disabled:pointer-events-none disabled:opacity-55";

const secondaryBtn =
  "btn-press inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-pill)] border border-[var(--color-hairline)] bg-[var(--color-white)] px-5 text-sm font-semibold text-[var(--color-ink)] hover:border-[var(--color-charcoal)] hover:bg-[var(--color-pearl)] disabled:pointer-events-none disabled:opacity-55";

const panelClass =
  "w-full max-w-[520px] rounded-[var(--radius-panel)] border border-[var(--color-hairline)] bg-[var(--color-white)] p-6 shadow-[var(--shadow-panel)] md:p-10";

function Field({
  label,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
}) {
  const id = props.id ?? props.name;
  return (
    <label className="flex flex-col gap-1.5" htmlFor={id}>
      <span className="text-sm font-medium text-[var(--color-ink)]">{label}</span>
      <input
        {...props}
        id={id}
        className="field-input min-h-12 w-full rounded-[var(--radius-inputs)] border border-[var(--color-hairline)] bg-[var(--color-pearl)] px-4 text-base text-[var(--color-ink)] placeholder:text-[var(--color-smoke)]"
      />
      {hint ? (
        <span className="text-xs text-[var(--color-smoke)]">{hint}</span>
      ) : null}
    </label>
  );
}

export function ReferralForm() {
  const [view, setView] = useState<"form" | "thanks">("form");
  const [formKey, setFormKey] = useState(0);
  const [friendKeys, setFriendKeys] = useState([0]);
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
      <div className={`${panelClass} thanks-panel`}>
        <div
          className="mb-5 flex h-14 w-14 items-center justify-center rounded-[var(--radius-pill)] text-2xl font-semibold text-white"
          style={{ background: "var(--color-gold)" }}
          aria-hidden
        >
          ✓
        </div>
        <p className="text-sm font-semibold text-[var(--color-toyota-red)]">
          Nippon Toyota
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-[var(--color-ink)] md:text-5xl">
          Thank you
        </h1>
        <p className="mt-3 max-w-[36ch] text-base leading-relaxed text-[var(--color-charcoal)]">
          Your referral is with us. Our team will follow up with your friend
          soon.
        </p>
        <div className="mt-8">
          <button
            type="button"
            className={primaryBtn}
            onClick={() => {
              setFriendKeys([0]);
              setView("form");
              setFormKey((n) => n + 1);
            }}
          >
            Refer another friend
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={panelClass}>
      <header className="mb-8">
        <p className="text-sm font-semibold text-[var(--color-toyota-red)]">
          Nippon Toyota
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-[var(--color-ink)] md:text-[2.75rem] md:leading-[1.1]">
          Refer a friend
        </h1>
        <p className="mt-3 max-w-[40ch] text-base leading-relaxed text-[var(--color-charcoal)]">
          Tell us about yourself, then add anyone interested in a Glanza or
          Hyryder.
        </p>
      </header>

      <form
        key={formKey}
        action={formAction}
        className="flex flex-col gap-8"
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

        <section className="flex flex-col gap-4" aria-labelledby="you-heading">
          <h2
            id="you-heading"
            className="text-sm font-semibold text-[var(--color-ink)]"
          >
            Your details
          </h2>
          <Field
            label="Your name"
            name="customerName"
            required
            minLength={2}
            maxLength={100}
            autoComplete="name"
            defaultValue={customer.name}
          />
          <Field
            label="Your mobile"
            name="customerPhone"
            required
            inputMode="tel"
            autoComplete="tel"
            placeholder="10-digit Indian mobile"
            hint="We’ll use this if we need to reach you about the referral."
            defaultValue={customer.phone}
          />
        </section>

        <section
          className="flex flex-col gap-4"
          aria-labelledby="friends-heading"
        >
          <div className="flex items-end justify-between gap-3">
            <h2
              id="friends-heading"
              className="text-sm font-semibold text-[var(--color-ink)]"
            >
              Who you’re referring
            </h2>
            <span className="text-xs text-[var(--color-smoke)]">
              {friendKeys.length}/{MAX_FRIENDS}
            </span>
          </div>

          {friendKeys.map((key, index) => {
            const n = index + 1;
            return (
              <div
                key={key}
                className={`friend-block flex flex-col gap-4 rounded-[var(--radius-inputs)] border border-[var(--color-hairline)] bg-[var(--color-pearl)]/60 p-4 ${
                  index > 0 ? "mt-1" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[var(--color-charcoal)]">
                    Friend {n}
                  </p>
                  {friendKeys.length > 1 ? (
                    <button
                      type="button"
                      className="btn-press text-sm font-semibold text-[var(--color-danger)]"
                      onClick={() =>
                        setFriendKeys((keys) => keys.filter((k) => k !== key))
                      }
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
                <Field
                  label="Their name"
                  id={`referredName-${key}`}
                  name="referredName"
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="off"
                />
                <Field
                  label="Their mobile"
                  id={`referredPhone-${key}`}
                  name="referredPhone"
                  required
                  inputMode="tel"
                  autoComplete="off"
                  placeholder="10-digit Indian mobile"
                />
                <fieldset className="flex flex-col gap-2">
                  <legend className="text-sm font-medium text-[var(--color-ink)]">
                    Interested model
                  </legend>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {(["glanza", "hyryder"] as const).map((value) => (
                      <label
                        key={value}
                        className="btn-press flex min-h-11 cursor-pointer items-center justify-center rounded-[var(--radius-pill)] border border-[var(--color-hairline)] bg-[var(--color-white)] px-4 text-sm font-semibold text-[var(--color-ink)] has-[:checked]:border-[var(--color-toyota-red)] has-[:checked]:bg-[var(--color-toyota-red-soft)] has-[:checked]:text-[var(--color-toyota-red)]"
                      >
                        <input
                          type="radio"
                          name={`referredModel-${index}`}
                          value={value}
                          required
                          className="sr-only"
                        />
                        {value === "hyryder" ? "Hyryder" : "Glanza"}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
            );
          })}

          {friendKeys.length < MAX_FRIENDS ? (
            <button
              type="button"
              className={secondaryBtn}
              onClick={() =>
                setFriendKeys((keys) => [...keys, (keys.at(-1) ?? 0) + 1])
              }
            >
              <span aria-hidden>+</span>
              Add another friend
            </button>
          ) : null}
        </section>

        {state && !state.ok ? (
          <p
            className="rounded-[var(--radius-inputs)] border border-[color-mix(in_srgb,var(--color-danger)_25%,white)] bg-[color-mix(in_srgb,var(--color-danger)_8%,white)] px-4 py-3 text-sm font-medium text-[var(--color-danger)]"
            role="alert"
          >
            {state.error}
          </p>
        ) : null}

        <button type="submit" className={primaryBtn} disabled={pending}>
          {pending ? "Submitting…" : "Submit referral"}
        </button>
      </form>
    </div>
  );
}
