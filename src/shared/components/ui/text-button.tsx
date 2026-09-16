import type { ComponentPropsWithRef } from "react";
import Link from "next/link";
import { Icon } from "./icon";

type TextButtonVariant = "underline" | "plain";

export const textButtonNavigationClasses =
  "text-body-s text-text-secondary inline-flex h-10 shrink-0 items-center justify-center gap-1 px-2 py-1 text-center whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-primary";

export function TextLink({ className, ...props }: ComponentPropsWithRef<typeof Link>) {
  return (
    <Link
      className={[textButtonNavigationClasses, className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}

type TextButtonProps = ComponentPropsWithRef<"button"> & {
  showIcon?: boolean;
  variant?: TextButtonVariant;
};

export function TextButton({
  children,
  className,
  showIcon = true,
  type = "button",
  variant = "underline",
  ...props
}: TextButtonProps) {
  const isUnderline = variant === "underline";
  return (
    <button
      type={type}
      className={[
        "focus-visible:outline-border-primary inline-flex items-center gap-1 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2",
        isUnderline
          ? "text-caption-s text-text-secondary font-medium underline"
          : "text-body-s text-text-default",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
      {isUnderline && showIcon ? <Icon className="size-3.5" name="swap" /> : null}
    </button>
  );
}
