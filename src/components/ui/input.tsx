import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function Input({
  id,
  label,
  error,
  className = "",
  ...props
}: InputProps) {
  const inputId = id ?? props.name;
  return (
    <div className="flex w-full flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className="text-xs font-bold uppercase tracking-wide text-[var(--color-charcoal)]"
      >
        {label}
      </label>
      <input
        id={inputId}
        className={[
          "min-h-11 w-full border border-[var(--color-hairline)] bg-[var(--color-pearl)] px-4 py-3 text-base text-[var(--color-ink)]",
          "rounded-[var(--radius-inputs)] placeholder:text-[var(--color-smoke)]",
          "disabled:cursor-not-allowed disabled:opacity-60",
          error ? "border-[var(--color-danger)]" : "",
          className,
        ].join(" ")}
        aria-invalid={error ? true : undefined}
        aria-describedby={error && inputId ? `${inputId}-error` : undefined}
        {...props}
      />
      {error ? (
        <p
          id={inputId ? `${inputId}-error` : undefined}
          className="text-sm text-[var(--color-danger)]"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
