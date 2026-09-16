import type { ComponentPropsWithRef } from "react";
import { Icon } from "./icon";

type TextButtonVariant = "underline" | "plain";

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
