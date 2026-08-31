import type { ComponentPropsWithRef } from "react";

type BadgeProps = ComponentPropsWithRef<"span"> & {
  shape?: "rounded" | "square";
};

export function Badge({ className, shape = "square", ...props }: BadgeProps) {
  return (
    <span
      className={[
        "bg-status-warning text-label-m text-text-warning inline-flex items-center justify-center px-2 py-1 whitespace-nowrap",
        shape === "rounded" ? "rounded-full" : "rounded-xs",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
