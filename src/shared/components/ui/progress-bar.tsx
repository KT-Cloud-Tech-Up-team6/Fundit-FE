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

type ProgressStep = "complete" | "current" | "upcoming";

type ProgressStepperProps = Omit<ComponentPropsWithRef<"ol">, "children"> & {
  /** 왼쪽부터 완료·현재·예정 상태를 Figma 단계형 진행 표시와 같이 렌더링한다. */
  steps: ProgressStep[];
};

/**
 * Figma Progress Bar의 단계형 표현. 막대형 ProgressBar와 목적이 다르므로
 * value를 억지로 해석하지 않고 상태 배열을 명시적으로 받는다.
 */
export function ProgressStepper({ className, steps, ...props }: ProgressStepperProps) {
  return (
    <ol
      className={["flex items-center", className].filter(Boolean).join(" ")}
      aria-label="진행 단계"
      {...props}
    >
      {steps.map((step, index) => (
        <li className="flex min-w-0 flex-1 items-center last:flex-none" key={index}>
          <span
            aria-label={step === "complete" ? "완료" : step === "current" ? "진행 중" : "예정"}
            className={[
              "relative flex size-8 shrink-0 items-center justify-center rounded-full",
              step === "complete"
                ? "bg-layer-surface-primary text-text-inverse after:block after:h-2 after:w-1 after:-translate-y-px after:rotate-45 after:border-r-2 after:border-b-2"
                : step === "current"
                  ? "border-4 border-layer-surface-primary bg-layer-surface-default"
                  : "bg-layer-surface-disabled",
            ].join(" ")}
          />
          {index < steps.length - 1 ? (
            <span
              aria-hidden
              className={[
                "h-1 min-w-2 flex-1",
                step === "complete" ? "bg-layer-surface-primary" : "bg-border-default",
              ].join(" ")}
            />
          ) : null}
        </li>
      ))}
    </ol>
  );
}
