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
    fill: "bg-[var(--charcoal-200)] text-text-default in-data-[theme=dark]:bg-[var(--grey-medium-grey)]",
    outline: "border border-border-primary text-text-default",
    selected: "bg-layer-surface-primary text-text-inverse",
  },
  primaryLive: {
    fill: "bg-[var(--blue-100)] text-text-static-primary-live in-data-[theme=dark]:bg-[#45539b]",
    outline:
      "border border-[var(--blue-500)] text-text-static-primary-live in-data-[theme=dark]:border-[var(--blue-400)]",
    selected: "bg-layer-surface-primary-live text-text-static-white",
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
        "text-label-l inline-flex items-center justify-center rounded-full whitespace-nowrap",
        "focus-visible:outline-2 focus-visible:outline-offset-2",
        variant === "primary"
          ? "focus-visible:outline-border-primary"
          : "focus-visible:outline-border-primary-live",
        appearanceClasses[variant][appearance],
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
