import type { ComponentPropsWithRef } from "react";

type ProgressBarProps = Omit<ComponentPropsWithRef<"div">, "children"> & {
  value?: number;
  variant?: "primary" | "primaryLive";
};

export function ProgressBar({
  className,
  value = 33.333,
  variant = "primary",
  ...props
}: ProgressBarProps) {
  const clampedValue = Number.isNaN(value) ? 0 : Math.min(100, Math.max(0, value));
  const indicatorClass =
    variant === "primary" ? "bg-layer-surface-primary" : "bg-layer-surface-primary-live";

  return (
    <div
      className={["relative h-3.5 w-full", className].filter(Boolean).join(" ")}
      role="progressbar"
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={clampedValue}
      {...props}
    >
      <div className="bg-border-default absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full" />
      <div
        className={[
          "absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded-full",
          indicatorClass,
        ].join(" ")}
        style={{ width: `${clampedValue}%` }}
      >
        <span
          className={[
            "absolute top-1/2 right-0 size-3.5 translate-x-1/2 -translate-y-1/2 rounded-full",
            indicatorClass,
          ].join(" ")}
        />
      </div>
    </div>
  );
}
