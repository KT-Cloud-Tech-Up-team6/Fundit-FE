import type { ComponentPropsWithoutRef } from "react";

type SelectProps = ComponentPropsWithoutRef<"select"> & {
  error?: boolean;
};

export function Select({ children, className, disabled, error = false, ...props }: SelectProps) {
  return (
    <div
      className={[
        "border-w-xs bg-layer-surface-default relative flex h-13 w-full items-center rounded-sm",
        error
          ? "border-border-accent-warning focus-within:border-border-accent-warning"
          : "border-border-default focus-within:border-border-primary",
        disabled && "bg-layer-surface-disabled border-transparent",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <select
        aria-invalid={error || undefined}
        className={[
          "text-body-m size-full appearance-none bg-transparent pr-10 pl-4 outline-none",
          disabled
            ? "text-text-disabled cursor-not-allowed"
            : error
              ? "text-text-warning"
              : "text-text-default",
        ].join(" ")}
        disabled={disabled}
        {...props}
      >
        {children}
      </select>
      {/* 아래 방향 화살표. 회전한 사각형의 두 변으로 그려 아이콘 asset 없이 처리한다. */}
      <span
        aria-hidden
        className={[
          "pointer-events-none absolute right-4 size-2 -translate-y-1/4 rotate-45",
          "border-r border-b",
          disabled ? "border-text-disabled" : "border-text-default",
        ].join(" ")}
      />
    </div>
  );
}
