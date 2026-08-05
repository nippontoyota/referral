import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: "div" | "section" | "article";
  hero?: boolean;
  children: ReactNode;
};

export function Card({
  as: Tag = "div",
  hero = false,
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <Tag
      className={[
        "border border-[var(--color-hairline)] bg-[var(--color-white)]",
        hero
          ? "rounded-[24px] p-6 md:rounded-[var(--radius-hero)] md:p-12"
          : "rounded-[var(--radius-cards)] p-6 md:p-12",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </Tag>
  );
}

type BrandPanelProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function BrandPanel({
  className = "",
  children,
  ...props
}: BrandPanelProps) {
  return (
    <div
      className={[
        "rounded-[var(--radius-cards)] bg-[var(--color-toyota-red)] p-6 text-white md:p-8",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
