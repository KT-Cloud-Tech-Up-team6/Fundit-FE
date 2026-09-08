import type { ComponentPropsWithRef, ReactNode } from "react";

type InputSize = "sm" | "md";

/* 네이티브 `size`(문자 수)는 쓰지 않는다. SearchField와 같이 디자인 사양의 크기 이름으로 덮는다. */
type InputProps = Omit<ComponentPropsWithRef<"input">, "size"> & {
  endAdornment?: ReactNode;
  error?: boolean;
  size?: InputSize;
};

/* sm은 발송정보 표의 `td_tracking_number`(180×30) 사양이다. 표 행에 들어가야 해서
   md(52px)로는 행이 과하게 높아진다. md는 폼 화면의 기존 사양이라 그대로 둔다. */
const sizeClasses: Record<InputSize, string> = {
  sm: "h-9 rounded-xs",
  md: "h-13 rounded-sm",
};

const textClasses: Record<InputSize, string> = {
  sm: "text-body-s placeholder:text-body-s",
  md: "text-body-m placeholder:text-body-s",
};

const paddingClasses: Record<InputSize, { bare: string; adorned: string }> = {
  sm: { bare: "px-3", adorned: "gap-1 pr-1 pl-3" },
  md: { bare: "px-4", adorned: "gap-2 pr-2 pl-4" },
};

export function Input({
  className,
  disabled,
  endAdornment,
  error = false,
  size = "md",
  ...props
}: InputProps) {
  return (
    <div
      className={[
        "border-w-xs bg-layer-surface-default flex w-full items-center overflow-hidden py-1",
        sizeClasses[size],
        endAdornment ? paddingClasses[size].adorned : paddingClasses[size].bare,
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
          "disabled:text-text-disabled min-w-0 flex-1 bg-transparent outline-none",
          textClasses[size],
          error
            ? "text-text-warning placeholder:text-text-warning"
            : "text-text-default placeholder:text-text-disabled",
        ].join(" ")}
        aria-invalid={error || undefined}
        disabled={disabled}
        {...props}
      />
      {endAdornment ? (
        <span
          className={`flex ${size === "sm" ? "size-6" : "size-7"} shrink-0 items-center justify-center`}
        >
          {endAdornment}
        </span>
      ) : null}
    </div>
  );
}
