import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "destructive" | "destructive-solid";

const variants: Record<Variant, string> = {
  primary:
    "border-transparent bg-[var(--color-toyota-red)] text-white hover:bg-[var(--color-toyota-red-dark)] disabled:opacity-60",
  secondary:
    "border-[var(--color-ink)] bg-transparent text-[var(--color-ink)] hover:bg-[var(--color-pearl)] disabled:opacity-60",
  destructive:
    "border-[var(--color-danger)] bg-transparent text-[var(--color-danger)] hover:bg-[color-mix(in_srgb,var(--color-danger)_8%,white)] disabled:opacity-60",
  "destructive-solid":
    "border-transparent bg-[var(--color-danger)] text-white hover:opacity-90 disabled:opacity-60",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  fullWidth?: boolean;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  fullWidth = false,
  className = "",
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        "inline-flex min-h-11 items-center justify-center border px-6 text-sm font-bold transition-colors",
        "rounded-[var(--radius-pill)]",
        fullWidth ? "w-full" : "w-full md:w-auto md:min-w-[200px]",
        variants[variant],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
