"use client";

import { useState } from "react";
import type { ChangeEvent, ComponentPropsWithRef } from "react";

type SearchFieldProps = Omit<ComponentPropsWithRef<"input">, "size"> & {
  clearLabel?: string;
  onClear?: () => void;
  size?: "sm" | "md";
};

/* sm은 판매자 프로젝트 목록의 `search_input_bt`(282×36) 사양이다. 와이어프레임이
   테두리 없는 #ededed 박스로 그려져 있어, Input·Select가 공유하는 "흰 배경 + 1px
   테두리" 입력 계열 규약을 따르지 않는다. 테두리가 없으니 포커스도 border 대신
   outline으로 표시한다.
   md는 대응하는 디자인이 아직 없어 기존 규약 그대로 둔다. */
const fieldSizeClasses = {
  sm: "bg-layer-surface-disabled focus-within:outline-border-primary h-9 rounded-xs pl-4 focus-within:outline-2 focus-within:outline-offset-[-2px]",
  md: "border-w-xs border-border-default bg-layer-surface-default focus-within:border-border-primary h-13 rounded-sm pl-1.5",
} as const;
const slotSizeClasses = { sm: "size-7", md: "size-10" } as const;
const iconSizeClasses = { sm: "size-4", md: "size-5" } as const;
/* Figma sm 본문은 `Caption/Regular_14`. md는 기존 `Body/Regular_16` + placeholder 14. */
const textSizeClasses = {
  sm: "text-caption-m",
  md: "text-body-m placeholder:text-body-s",
} as const;

export function SearchField({
  className,
  clearLabel = "검색어 지우기",
  defaultValue,
  disabled,
  onChange,
  onClear,
  size = "md",
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
        "flex w-full items-center gap-1 overflow-hidden py-1 pr-1.5",
        fieldSizeClasses[size],
        disabled && "bg-layer-surface-disabled border-transparent",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className={`flex ${slotSizeClasses[size]} shrink-0 items-center justify-center`}>
        <span
          className={[
            `${iconSizeClasses[size]} [mask-image:url('/icons/search.svg')] [mask-size:contain] [mask-position:center] [mask-repeat:no-repeat]`,
            disabled ? "bg-text-disabled" : "bg-text-default",
          ].join(" ")}
        />
      </span>
      <input
        className={`${textSizeClasses[size]} text-text-default placeholder:text-text-disabled disabled:text-text-disabled min-w-0 flex-1 bg-transparent outline-none`}
        disabled={disabled}
        onChange={handleChange}
        value={currentValue}
        {...props}
      />
      {currentValue && !disabled ? (
        <button
          type="button"
          className={`focus-visible:outline-border-primary flex ${slotSizeClasses[size]} shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-[-2px]`}
          aria-label={clearLabel}
          onClick={handleClear}
        >
          <span className="bg-text-default size-3 [mask-image:url('/icons/input-clear.svg')] [mask-size:contain] [mask-position:center] [mask-repeat:no-repeat]" />
        </button>
      ) : null}
    </div>
  );
}
