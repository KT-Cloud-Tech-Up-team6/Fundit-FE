import type { ComponentPropsWithRef } from "react";

type ProgressBarProps = Omit<ComponentPropsWithRef<"div">, "children"> & {
  /** Figma progress bar 컴포넌트는 끝점에 손잡이가 있고, 목록 카드의 rating_bar는 없다. */
  knob?: boolean;
  value?: number;
  variant?: "primary" | "primaryLive";
};

export function ProgressBar({
  className,
  knob = true,
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
        {knob ? (
          <span
            className={[
              "absolute top-1/2 right-0 size-3.5 translate-x-1/2 -translate-y-1/2 rounded-full",
              indicatorClass,
            ].join(" ")}
          />
        ) : null}
      </div>
    </div>
  );
}
