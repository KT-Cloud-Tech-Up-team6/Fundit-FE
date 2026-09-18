import type { ComponentPropsWithRef } from "react";
import { Icon } from "@/shared/components/ui/icon";

/** Figma Badge의 state. legacy 값은 기존 화면 이행 중 호환용 별칭이다. */
export type BadgeVariant =
  | "warning"
  | "success"
  | "error"
  | "info"
  | "accent"
  | "primary"
  | "primaryLive"
  | "caution"
  | "neutral"
  | "live";

type BadgeProps = ComponentPropsWithRef<"span"> & {
  shape?: "rounded" | "square";
  showIcon?: boolean;
  /** Figma Badge S(24px) / M(26px). 목록 카드의 상태 배지는 M이다. */
  size?: "sm" | "md";
  variant?: BadgeVariant;
};

const variantClasses: Record<BadgeVariant, string> = {
  warning: "bg-status-warning text-text-warning",
  success: "bg-status-success text-text-success",
  error: "bg-status-error text-text-error",
  info: "bg-status-info text-text-info",
  accent: "bg-status-accent text-text-static-primary-live",
  primary: "bg-layer-surface-primary text-text-inverse",
  primaryLive: "bg-layer-surface-primary-live text-text-static-white",
  /* Deprecated aliases — 기존 사용처를 Figma의 정식 state로 점진 이행한다. */
  caution: "bg-status-error text-text-error",
  neutral: "bg-status-info text-text-info",
  live: "bg-status-accent text-text-static-primary-live",
};

const sizeClasses = {
  sm: "h-6 text-label-m",
  md: "h-[26px] text-caption-s font-medium",
} as const;

export function Badge({
  className,
  shape = "square",
  showIcon = false,
  size = "sm",
  variant = "warning",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center justify-center gap-1 px-2 py-1 whitespace-nowrap",
        sizeClasses[size],
        variantClasses[variant],
        shape === "rounded" ? "rounded-full" : "rounded-xs",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {showIcon ? <Icon name="live" className="size-4 shrink-0" /> : null}
      {children}
    </span>
  );
}
