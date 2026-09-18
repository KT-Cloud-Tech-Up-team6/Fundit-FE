import Link from "next/link";
import type { ComponentPropsWithRef } from "react";

type ButtonVariant = "primary" | "primaryLive" | "secondary";
type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";
type ButtonAppearance = "default" | "cta";

type ButtonStyleProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  appearance?: ButtonAppearance;
  shape?: "default" | "pill";
};

type NativeButtonProps = ComponentPropsWithRef<"button"> & ButtonStyleProps & { href?: never };

type LinkButtonProps = Omit<ComponentPropsWithRef<typeof Link>, "href"> &
  ButtonStyleProps & {
    /** 버튼 모양을 유지한 페이지 이동. 중첩 interactive 요소를 만들지 않는다. */
    href: string;
    disabled?: boolean;
  };

type ButtonProps = NativeButtonProps | LinkButtonProps;

function isLinkButton(props: ButtonProps): props is LinkButtonProps {
  return typeof props.href === "string";
}

function omitProps<T extends object, const Keys extends readonly (keyof T)[]>(
  props: T,
  keys: Keys,
): Omit<T, Keys[number]> {
  const omittedKeys = new Set<PropertyKey>(keys);
  return Object.fromEntries(Object.entries(props).filter(([key]) => !omittedKeys.has(key))) as Omit<
    T,
    Keys[number]
  >;
}

function omitEventHandlers<T extends object>(props: T): T {
  return Object.fromEntries(
    Object.entries(props).filter(([key]) => !key.startsWith("on")),
  ) as T;
}

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

export function Button(props: ButtonProps) {
  const {
    className,
    variant = "primary",
    size = "lg",
    appearance = "default",
    shape = "default",
  } = props;
  const disabled = props.disabled ?? false;
  const classNames = [
    "inline-flex items-center justify-center py-1 whitespace-nowrap transition-colors",
    shape === "pill" ? "rounded-full px-4" : "rounded-xs px-2",
    "focus-visible:outline-2 focus-visible:outline-offset-2",
    "disabled:text-text-disabled disabled:cursor-not-allowed",
    disabledBgByVariant[variant],
    variantClasses[variant],
    appearance === "cta" ? ctaSizeClasses[size] : sizeClasses[size],
    isLinkButton(props) &&
      disabled &&
      (variant === "secondary"
        ? "bg-layer-surface-disabled text-text-disabled cursor-not-allowed"
        : "bg-layer-surface-primary-disabled text-text-disabled cursor-not-allowed"),
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (isLinkButton(props)) {
    const { href, children } = props;
    const linkProps = omitProps(props, [
      "href",
      "children",
      "className",
      "variant",
      "size",
      "appearance",
      "shape",
      "disabled",
    ]);

    if (disabled) {
      const disabledProps = omitEventHandlers(
        omitProps(linkProps, [
          "download",
          "onNavigate",
          "ping",
          "prefetch",
          "ref",
          "rel",
          "replace",
          "scroll",
          "target",
          "transitionTypes",
        ]),
      ) as ComponentPropsWithRef<"span">;

      return (
        <span
          {...disabledProps}
          aria-disabled="true"
          className={classNames}
        >
          {props.children}
        </span>
      );
    }

    return (
      <Link {...linkProps} href={href} className={classNames}>
        {children}
      </Link>
    );
  }

  const { type = "button" } = props;
  const buttonProps = omitProps(props, [
    "className",
    "variant",
    "size",
    "appearance",
    "shape",
    "disabled",
    "type",
  ]);

  return <button type={type} className={classNames} disabled={disabled} {...buttonProps} />;
}
