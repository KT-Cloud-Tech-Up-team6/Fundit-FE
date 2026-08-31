import type { ComponentPropsWithRef } from "react";

type TabProps = ComponentPropsWithRef<"button"> & {
  selected?: boolean;
  size?: "md" | "lg";
  variant?: "primary" | "primaryLive";
};

const sizeClasses: Record<NonNullable<TabProps["size"]>, string> = {
  md: "w-[130px] text-body-emphasis",
  lg: "w-[195px] text-title-s font-medium",
};

export function Tab({
  className,
  disabled,
  selected = false,
  size = "lg",
  tabIndex,
  type = "button",
  variant = "primary",
  ...props
}: TabProps) {
  const active = selected && !disabled;
  const activeClasses =
    variant === "primary"
      ? "border-border-primary text-text-default"
      : "border-border-primary-live text-text-primary-live";
  const activeBorderClass = size === "md" ? "border-b-[1.5px]" : "border-b-[1.8px]";

  return (
    <button
      type={type}
      className={[
        "bg-layer-surface-default flex h-13 items-center justify-center overflow-hidden p-2 whitespace-nowrap",
        "focus-visible:outline-border-primary focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px]",
        active
          ? `${activeClasses} ${activeBorderClass}`
          : "border-border-default text-text-disabled border-b",
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-selected={selected}
      disabled={disabled}
      role="tab"
      tabIndex={tabIndex ?? (selected ? 0 : -1)}
      {...props}
    />
  );
}

type TabListProps = ComponentPropsWithRef<"div">;

export function TabList({ className, ...props }: TabListProps) {
  return (
    <div
      className={["flex w-[390px] items-center", className].filter(Boolean).join(" ")}
      role="tablist"
      {...props}
    />
  );
}
