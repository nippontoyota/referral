"use client";

import type { InputHTMLAttributes } from "react";
import { useActionState, useEffect, useRef, useState } from "react";

import { submitReferral, type ReferralResult } from "@/app/actions/referral";
import { MAX_FRIENDS } from "@/schemas/referral";

const primaryBtn =
  "btn-press inline-flex min-h-12 w-full items-center justify-center rounded-[var(--radius-pill)] bg-[var(--color-toyota-red)] px-6 text-[15px] font-semibold text-white hover:bg-[var(--color-toyota-red-dark)] disabled:pointer-events-none disabled:opacity-55";

const secondaryBtn =
  "btn-press inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-inputs)] border border-dashed border-[var(--color-hairline)] bg-[var(--color-pearl)]/40 px-5 text-sm font-semibold text-[var(--color-ink)] hover:border-[var(--color-charcoal)] hover:bg-[var(--color-pearl)] disabled:pointer-events-none disabled:opacity-55";

const panelClass =
  "w-full max-w-[540px] rounded-[var(--radius-panel)] border border-[var(--color-hairline)] bg-[var(--color-white)] shadow-[var(--shadow-panel)]";

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
        className="field-input min-h-12 w-full rounded-[var(--radius-inputs)] border border-[var(--color-hairline)] bg-[var(--color-white)] px-4 text-base text-[var(--color-ink)] placeholder:text-[var(--color-smoke)]"
      />
      {hint ? (
        <span className="text-xs leading-snug text-[var(--color-smoke)]">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

function BrandMark() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-toyota-red)] text-sm font-bold text-white"
        aria-hidden
      >
        N
      </span>
      <span className="text-sm font-semibold tracking-wide text-[var(--color-toyota-red)]">
        Nippon Toyota
      </span>
    </span>
  );
}

export function ReferralForm() {
  const [view, setView] = useState<"form" | "thanks">("form");
  const [formKey, setFormKey] = useState(0);
  const [friendKeys, setFriendKeys] = useState([0]);
  const [submittedCount, setSubmittedCount] = useState(1);
  const [customer, setCustomer] = useState({ name: "", phone: "" });
  const pendingFocusKey = useRef<number | null>(null);
  const friendRefs = useRef<Map<number, HTMLDivElement>>(new Map());

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
        setSubmittedCount(formData.getAll("referredName").length);
        setView("thanks");
      }
      return result;
    },
    null,
  );

  useEffect(() => {
    const key = pendingFocusKey.current;
    if (key === null) return;
    pendingFocusKey.current = null;
    const node = friendRefs.current.get(key);
    node?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    node
      ?.querySelector<HTMLInputElement>('input[name="referredName"]')
      ?.focus();
  }, [friendKeys]);

  if (view === "thanks") {
    const friendWord = submittedCount === 1 ? "friend" : "friends";
    return (
      <div className={`${panelClass} thanks-panel p-6 md:p-10`}>
        <BrandMark />
        <div
          className="mt-8 mb-5 flex h-14 w-14 items-center justify-center rounded-[var(--radius-pill)] bg-[var(--color-gold)] text-2xl font-semibold text-white"
          aria-hidden
        >
          ✓
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-[var(--color-ink)] md:text-5xl">
          Thank you
        </h1>
        <p className="mt-3 max-w-[38ch] text-base leading-relaxed text-[var(--color-charcoal)]">
          {submittedCount === 1
            ? "Your referral is with us. Our team will follow up with your friend soon."
            : `${submittedCount} referrals are with us. Our team will follow up with your ${friendWord} soon.`}
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
      <div className="p-6 pb-0 md:p-10 md:pb-0">
        <header className="mb-8">
          <BrandMark />
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-[var(--color-ink)] md:text-[2.75rem] md:leading-[1.08]">
            Refer a friend
          </h1>
          <p className="mt-3 max-w-[40ch] text-base leading-relaxed text-[var(--color-charcoal)]">
            Share your details, then add each person and the model they want.
          </p>
        </header>

        <form
          key={formKey}
          id="referral-form"
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
              className="text-base font-semibold text-[var(--color-ink)]"
            >
              Your details
            </h2>
            <div className="flex flex-col gap-4">
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
                placeholder="10-digit mobile"
                defaultValue={customer.phone}
              />
            </div>
          </section>

          <section
            className="flex flex-col gap-4"
            aria-labelledby="friends-heading"
          >
            <div className="flex items-end justify-between gap-3">
              <h2
                id="friends-heading"
                className="text-base font-semibold text-[var(--color-ink)]"
              >
                Who you’re referring
              </h2>
              <span className="text-xs font-medium text-[var(--color-smoke)]">
                {friendKeys.length} of {MAX_FRIENDS}
              </span>
            </div>

            {friendKeys.map((key, index) => {
              const n = index + 1;
              return (
                <div
                  key={key}
                  ref={(el) => {
                    if (el) friendRefs.current.set(key, el);
                    else friendRefs.current.delete(key);
                  }}
                  className="friend-block flex flex-col gap-4 rounded-[var(--radius-inputs)] border border-[var(--color-hairline)] bg-[var(--color-pearl)] p-4 md:p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[var(--color-ink)]">
                      Friend {n}
                    </p>
                    {friendKeys.length > 1 ? (
                      <button
                        type="button"
                        className="btn-press text-sm font-semibold text-[var(--color-danger)]"
                        onClick={() =>
                          setFriendKeys((keys) =>
                            keys.filter((k) => k !== key),
                          )
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
                    placeholder="10-digit mobile"
                  />

                  <fieldset className="flex flex-col gap-2">
                    <legend className="text-sm font-medium text-[var(--color-ink)]">
                      Interested model
                    </legend>
                    <div className="flex flex-col gap-2">
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
                onClick={() => {
                  const next = (friendKeys.at(-1) ?? 0) + 1;
                  pendingFocusKey.current = next;
                  setFriendKeys((keys) => [...keys, next]);
                }}
              >
                <span aria-hidden className="text-lg leading-none">
                  +
                </span>
                Add another friend
              </button>
            ) : (
              <p className="text-sm text-[var(--color-smoke)]">
                Maximum of {MAX_FRIENDS} friends per submission.
              </p>
            )}
          </section>

          {state && !state.ok ? (
            <p
              className="rounded-[var(--radius-inputs)] border border-[color-mix(in_srgb,var(--color-danger)_25%,white)] bg-[color-mix(in_srgb,var(--color-danger)_8%,white)] px-4 py-3 text-sm font-medium text-[var(--color-danger)]"
              role="alert"
            >
              {state.error}
            </p>
          ) : null}
        </form>
      </div>

      <div className="sticky bottom-0 rounded-b-[var(--radius-panel)] border-t border-[var(--color-hairline)] bg-[color-mix(in_srgb,var(--color-white)_92%,transparent)] p-4 backdrop-blur-md md:p-6">
        <button
          type="submit"
          form="referral-form"
          className={primaryBtn}
          disabled={pending}
          aria-busy={pending}
        >
          {pending
            ? "Submitting…"
            : friendKeys.length > 1
              ? `Submit ${friendKeys.length} referrals`
              : "Submit referral"}
        </button>
      </div>
    </div>
  );
}
