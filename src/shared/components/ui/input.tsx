import type { ComponentPropsWithRef, ReactNode } from "react";

type InputProps = ComponentPropsWithRef<"input"> & {
  endAdornment?: ReactNode;
  error?: boolean;
};

export function Input({ className, disabled, endAdornment, error = false, ...props }: InputProps) {
  return (
    <div
      className={[
        "border-w-xs bg-layer-surface-default flex h-13 w-full items-center overflow-hidden rounded-sm py-1",
        endAdornment ? "gap-2 pr-2 pl-4" : "px-4",
        error
          ? "border-border-accent-warning text-text-warning focus-within:border-border-accent-warning"
          : "border-border-default focus-within:border-border-primary",
        disabled && "bg-layer-surface-disabled text-text-disabled border-transparent",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <input
        className={[
          "text-body-m placeholder:text-body-s disabled:text-text-disabled min-w-0 flex-1 bg-transparent outline-none",
          error
            ? "text-text-warning placeholder:text-text-warning"
            : "text-text-default placeholder:text-text-disabled",
        ].join(" ")}
        aria-invalid={error || undefined}
        disabled={disabled}
        {...props}
      />
      {endAdornment ? (
        <span className="flex size-7 shrink-0 items-center justify-center">{endAdornment}</span>
      ) : null}
    </div>
  );
}
