"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";

type RadioProps = Omit<ComponentPropsWithoutRef<"input">, "children" | "type"> & {
  children?: ReactNode;
};

/* checkbox.tsx의 shape="circle" 렌더링과 같은 기법(border + after pseudo 체크마크)을
   그대로 쓴다. type이 radio/checkbox로 시맨틱이 달라 컴포넌트는 분리했다. */
export function Radio({ children, className, disabled, ...props }: RadioProps) {
  return (
    <label
      className={[
        "inline-flex items-center gap-2",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="relative flex size-7 shrink-0 items-center justify-center p-1">
        <input className="peer sr-only" disabled={disabled} type="radio" {...props} />
        <span
          aria-hidden
          className={[
            "border-border-default relative size-5 rounded-full border",
            "peer-focus-visible:outline-border-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2",
            "after:absolute after:top-1/2 after:left-1/2 after:h-2.5 after:w-1.5",
            "after:-translate-x-1/2 after:-translate-y-[60%] after:rotate-45",
            disabled ? "after:border-text-disabled" : "after:border-text-inverse",
            "after:border-r-2 after:border-b-2 after:opacity-0 peer-checked:after:opacity-100",
            disabled
              ? "bg-layer-surface-disabled border-transparent"
              : "peer-checked:bg-layer-surface-primary peer-checked:border-transparent",
          ].join(" ")}
        />
      </span>
      {children ? (
        <span
          className={["text-body-m", disabled ? "text-text-disabled" : "text-text-default"].join(
            " ",
          )}
        >
          {children}
        </span>
      ) : null}
    </label>
  );
}
