import type { ComponentPropsWithRef } from "react";

type ButtonVariant = "primary" | "primaryLive";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ComponentPropsWithRef<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-layer-surface-primary text-text-inverse enabled:hover:bg-layer-surface-primary-hover focus-visible:outline-border-primary",
  primaryLive:
    "bg-layer-surface-primary-live text-text-inverse enabled:hover:bg-layer-surface-primary-live-hover focus-visible:outline-border-primary-live",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-7 text-body-m",
  md: "h-9 text-title-s font-medium",
  lg: "h-[46px] text-title-s font-medium",
};

/* ponytail: Foundations의 Button은 primary / primary_live 둘뿐이라 보조 CTA variant가 없다.
   Foundations에 secondary가 생기면 Button variant로 올린다. 그 전까지는 이 클래스 조합을
   여러 화면이 그대로 가져다 쓴다(live-create, project-story 등) — 각자 복붙하지 않는다. */
export const secondaryButtonClasses = [
  "text-body-s bg-layer-surface-disabled text-text-default rounded-xs",
  "flex items-center justify-center whitespace-nowrap",
  "enabled:hover:bg-layer-surface-disabled-hover",
  "focus-visible:outline-border-primary focus-visible:outline-2 focus-visible:outline-offset-2",
  "disabled:text-text-disabled disabled:cursor-not-allowed",
].join(" ");

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
