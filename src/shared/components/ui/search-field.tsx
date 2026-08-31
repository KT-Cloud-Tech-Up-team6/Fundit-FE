"use client";

import { useState } from "react";
import type { ChangeEvent, ComponentPropsWithRef } from "react";

type SearchFieldProps = ComponentPropsWithRef<"input"> & {
  clearLabel?: string;
  onClear?: () => void;
};

export function SearchField({
  className,
  clearLabel = "검색어 지우기",
  defaultValue,
  disabled,
  onChange,
  onClear,
  value,
  ...props
}: SearchFieldProps) {
  const [internalValue, setInternalValue] = useState(() => String(defaultValue ?? ""));
  const isControlled = value !== undefined;
  const currentValue = isControlled ? String(value ?? "") : internalValue;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    if (!isControlled) setInternalValue(event.target.value);
    onChange?.(event);
  }

  function handleClear() {
    if (!isControlled) setInternalValue("");
    onClear?.();
  }

  return (
    <div
      className={[
        "border-w-xs bg-layer-surface-default flex h-13 w-full items-center gap-1 overflow-hidden rounded-sm py-1 pr-1.5 pl-1.5",
        "border-border-default focus-within:border-border-primary",
        disabled && "bg-layer-surface-disabled border-transparent",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="flex size-10 shrink-0 items-center justify-center">
        <span
          className={[
            "size-5 [mask-image:url('/icons/search.svg')] [mask-size:contain] [mask-position:center] [mask-repeat:no-repeat]",
            disabled ? "bg-text-disabled" : "bg-text-default",
          ].join(" ")}
        />
      </span>
      <input
        className="text-body-m placeholder:text-body-s text-text-default placeholder:text-text-disabled disabled:text-text-disabled min-w-0 flex-1 bg-transparent outline-none"
        disabled={disabled}
        onChange={handleChange}
        value={currentValue}
        {...props}
      />
      {currentValue && !disabled ? (
        <button
          type="button"
          className="focus-visible:outline-border-primary flex size-10 shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-[-2px]"
          aria-label={clearLabel}
          onClick={handleClear}
        >
          <span className="bg-text-default size-3 [mask-image:url('/icons/input-clear.svg')] [mask-size:contain] [mask-position:center] [mask-repeat:no-repeat]" />
        </button>
      ) : null}
    </div>
  );
}
