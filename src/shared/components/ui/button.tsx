import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "primaryLive";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-layer-surface-primary text-text-inverse enabled:hover:bg-[var(--charcoal-800)] focus-visible:outline-border-primary",
  primaryLive:
    "bg-layer-surface-primary-live text-text-inverse enabled:hover:bg-[var(--blue-700)] focus-visible:outline-border-primary-live",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-7 text-body-m",
  md: "h-9 text-title-s font-medium",
  lg: "h-[46px] text-title-s font-medium",
};

export function Button({
  className,
  variant = "primary",
  size = "lg",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        "inline-flex items-center justify-center rounded-xs px-2 py-1 whitespace-nowrap transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:bg-layer-surface-disabled disabled:text-text-disabled disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
