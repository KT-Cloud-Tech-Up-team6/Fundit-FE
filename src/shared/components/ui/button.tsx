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

/* primary 계열의 disabled는 Figma Button 토큰을, secondary는 일반 disabled surface를 쓴다. */
const disabledBgByVariant: Record<ButtonVariant, string> = {
  primary: "disabled:bg-layer-surface-primary-disabled",
  primaryLive: "disabled:bg-layer-surface-primary-disabled",
  secondary: "disabled:bg-layer-surface-disabled",
};

/* 기존 화면의 네이티브 button 사용처를 위한 호환 클래스다. 신규 코드는 Button의
   secondary variant를 사용하고, 기존 사용처는 별도 정리 작업에서 순차적으로 옮긴다. */
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
        "disabled:text-text-disabled disabled:cursor-not-allowed",
        disabledBgByVariant[variant],
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
