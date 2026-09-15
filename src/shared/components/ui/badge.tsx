import type { ComponentPropsWithRef } from "react";

type BadgeProps = ComponentPropsWithRef<"span"> & {
  shape?: "rounded" | "square";
  variant?: "warning" | "success" | "caution" | "neutral" | "live";
};

const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  warning: "bg-status-warning text-text-warning",
  success: "bg-status-success text-text-success",
  caution: "bg-status-error text-text-error",
  neutral: "bg-status-info text-text-secondary",
  live: "bg-[var(--blue-100)] text-text-primary-live",
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
