"use client";

import { useId, useState } from "react";
import type { ChangeEvent, ComponentPropsWithRef } from "react";

type TextareaProps = ComponentPropsWithRef<"textarea"> & {
  error?: boolean;
};

/**
 * `maxLength`를 주면 오른쪽 아래에 입력 길이 카운터가 붙는다.
 * 길이는 입력값에서 바로 나오는 값이라 컴포넌트가 갖는다. controlled면 `value`에서 읽고,
 * uncontrolled면 내부 상태로 센다. 업무 상태는 들이지 않는다.
 */
export function Textarea({
  className,
  defaultValue,
  disabled,
  error = false,
  maxLength,
  onChange,
  value,
  "aria-describedby": ariaDescribedBy,
  ...props
}: TextareaProps) {
  const counterId = useId();
  const [uncontrolledLength, setUncontrolledLength] = useState(
    () => String(defaultValue ?? "").length,
  );
  const length = value === undefined ? uncontrolledLength : String(value).length;
  const hasCounter = maxLength !== undefined;
  /* 카운터를 필드 설명으로 연결한다. 포커스 시 "n/max"가 읽혀 길이 제한을 알 수 있다.
     타이핑마다 announce하면 시끄러우니 live 영역으로는 두지 않는다. */
  const describedBy =
    [ariaDescribedBy, hasCounter ? counterId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div
      className={[
        "border-w-xs bg-layer-surface-default flex flex-col gap-2 rounded-xs px-4 py-3",
        error
          ? "border-border-accent-warning focus-within:border-border-accent-warning"
          : "border-border-default focus-within:border-border-primary",
        disabled && "bg-layer-surface-disabled border-transparent",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <textarea
        aria-describedby={describedBy}
        aria-invalid={error || undefined}
        className={[
          "text-body-s min-h-0 flex-1 resize-none bg-transparent outline-none",
          disabled
            ? "text-text-disabled cursor-not-allowed"
            : error
              ? "text-text-warning placeholder:text-text-warning"
              : "text-text-default placeholder:text-text-disabled",
        ].join(" ")}
        defaultValue={defaultValue}
        disabled={disabled}
        maxLength={maxLength}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
          if (value === undefined) setUncontrolledLength(event.target.value.length);
          onChange?.(event);
        }}
        value={value}
        {...props}
      />
      {hasCounter ? (
        <p id={counterId} className="text-caption-strong text-text-secondary shrink-0 text-right">
          {length}/{maxLength}
        </p>
      ) : null}
    </div>
  );
}
