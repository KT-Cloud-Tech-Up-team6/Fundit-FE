import type { ComponentPropsWithRef } from "react";

type ChipVariant = "primary" | "primaryLive";
type ChipAppearance = "fill" | "outline" | "selected";
type ChipSize = "sm" | "md";

type ChipProps = ComponentPropsWithRef<"button"> & {
  appearance?: ChipAppearance;
  size?: ChipSize;
  variant?: ChipVariant;
};

const appearanceClasses: Record<ChipVariant, Record<ChipAppearance, string>> = {
  primary: {
    fill: "bg-[var(--charcoal-200)] text-text-default in-data-[theme=dark]:bg-[var(--grey-medium-grey)] enabled:hover:brightness-95",
    outline:
      "border border-border-primary text-text-default enabled:hover:bg-layer-surface-disabled",
    selected:
      "bg-layer-surface-primary text-text-inverse enabled:hover:bg-layer-surface-primary-hover",
  },
  primaryLive: {
    fill: "bg-[var(--blue-100)] text-text-static-primary-live in-data-[theme=dark]:bg-[#45539b] enabled:hover:brightness-95",
    outline:
      "border border-[var(--blue-500)] text-text-static-primary-live in-data-[theme=dark]:border-[var(--blue-400)] enabled:hover:brightness-95",
    selected:
      "bg-layer-surface-primary-live text-text-static-white enabled:hover:bg-layer-surface-primary-live-hover",
  },
};

const sizeClasses: Record<ChipSize, string> = {
  sm: "px-2",
  md: "px-3 py-1",
};

export function Chip({
  appearance = "fill",
  className,
  size = "sm",
  type = "button",
  variant = "primary",
  ...props
}: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={appearance === "selected" || undefined}
      className={[
        "text-label-l inline-flex items-center justify-center rounded-full whitespace-nowrap transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2",
        variant === "primary"
          ? "focus-visible:outline-border-primary"
          : "focus-visible:outline-border-primary-live",
        appearanceClasses[variant][appearance],
        "disabled:bg-layer-surface-disabled disabled:text-text-disabled disabled:cursor-not-allowed disabled:border-transparent",
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
