import type { ComponentPropsWithRef } from "react";

type BadgeProps = ComponentPropsWithRef<"span"> & {
  shape?: "rounded" | "square";
  variant?: "warning" | "success" | "caution" | "neutral" | "live" | "primary";
};

const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  warning: "bg-status-warning text-text-warning",
  success: "bg-status-success text-text-success",
  caution: "bg-status-error text-text-error",
  neutral: "bg-status-info text-text-secondary",
  /* chip.tsx의 primaryLive fill과 같은 조합(라이트 blue-100 / 다크 #45539b)을 재사용한다. */
  live: "bg-[var(--blue-100)] text-text-primary-live in-data-[theme=dark]:bg-[#45539b]",
  /* Figma "진행중" 배지(제작·배송 탭) — 채워진 검정 + 흰 글자. */
  primary: "bg-layer-surface-primary text-text-inverse",
};

export function Badge({ className, shape = "square", variant = "warning", ...props }: BadgeProps) {
  return (
    <span
      className={[
        "text-label-m inline-flex items-center justify-center gap-1 px-2 py-1 whitespace-nowrap",
        variantClasses[variant],
        shape === "rounded" ? "rounded-full" : "rounded-xs",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
