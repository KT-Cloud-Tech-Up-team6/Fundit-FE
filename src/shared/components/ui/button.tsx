import type { ComponentPropsWithRef } from "react";

type ButtonVariant = "primary" | "primaryLive" | "secondary";
type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";
type ButtonAppearance = "default" | "cta";

type ButtonProps = ComponentPropsWithRef<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  appearance?: ButtonAppearance;
  shape?: "default" | "pill";
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-layer-surface-primary text-text-inverse enabled:hover:bg-layer-surface-primary-hover focus-visible:outline-border-primary",
  primaryLive:
    "bg-layer-surface-primary-live text-text-inverse enabled:hover:bg-layer-surface-primary-live-hover focus-visible:outline-border-primary-live",
  secondary:
    "bg-layer-surface-disabled text-text-default enabled:hover:bg-layer-surface-disabled-hover focus-visible:outline-border-primary",
};

const sizeClasses: Record<ButtonSize, string> = {
  /* Figma의 XS·XL 단계. 기존 sm/md/lg 사용처의 크기는 호환성을 위해 유지한다. */
  xs: "h-6 text-body-s",
  sm: "h-7 text-body-m",
  md: "h-9 text-title-s font-medium",
  lg: "h-[46px] text-title-s font-medium",
  xl: "h-13 text-title-s font-medium",
};

const ctaSizeClasses: Record<ButtonSize, string> = {
  xs: "h-6 text-body-strong",
  sm: "h-9 text-body-strong",
  md: "h-10 text-body-strong",
  lg: "h-[46px] text-body-strong",
  xl: "h-13 text-body-strong",
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
  appearance = "default",
  shape = "default",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        "inline-flex items-center justify-center py-1 whitespace-nowrap transition-colors",
        shape === "pill" ? "rounded-full px-4" : "rounded-xs px-2",
        "focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:bg-layer-surface-disabled disabled:text-text-disabled disabled:cursor-not-allowed",
        variantClasses[variant],
        appearance === "cta" ? ctaSizeClasses[size] : sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
