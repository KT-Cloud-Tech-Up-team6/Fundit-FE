"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";

type CheckboxProps = Omit<ComponentPropsWithoutRef<"input">, "children" | "type"> & {
  children?: ReactNode;
  indeterminate?: boolean;
};

/* 체크와 부분 선택 표시는 아이콘 asset 없이 pseudo element로 그린다.
   회전한 두 변이 체크, 가로 막대가 부분 선택이다. */
const markClasses = [
  "after:absolute after:top-1/2 after:left-1/2 after:h-2.5 after:w-1.5",
  "after:-translate-x-1/2 after:-translate-y-[60%] after:rotate-45",
  "after:border-text-inverse after:border-r-2 after:border-b-2 after:opacity-0",
  "before:absolute before:top-1/2 before:left-1/2 before:h-0.5 before:w-2.5",
  "before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-full",
  "before:bg-text-inverse before:opacity-0",
].join(" ");

export function Checkbox({
  children,
  className,
  disabled,
  indeterminate = false,
  ...props
}: CheckboxProps) {
  /* checked와 indeterminate가 동시에 켜지면 두 표시가 겹친다. Tailwind 변형끼리는
     출력 순서가 보장되지 않으므로 어느 쪽을 그릴지 JS에서 정한다. */
  const stateClasses = disabled
    ? "bg-layer-surface-disabled border-transparent"
    : indeterminate
      ? "bg-layer-surface-primary border-transparent before:opacity-100"
      : "peer-checked:bg-layer-surface-primary peer-checked:border-transparent peer-checked:after:opacity-100";

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
      <input
        className="peer sr-only"
        disabled={disabled}
        ref={(node) => {
          if (node) node.indeterminate = indeterminate;
        }}
        type="checkbox"
        {...props}
      />
      <span
        aria-hidden
        className={[
          "border-border-default relative size-5 shrink-0 rounded-full border",
          "peer-focus-visible:outline-border-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2",
          markClasses,
          stateClasses,
        ].join(" ")}
      />
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
