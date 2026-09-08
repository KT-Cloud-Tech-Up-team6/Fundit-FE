import type { ComponentPropsWithoutRef } from "react";

type SelectSize = "sm" | "md";

/* 네이티브 `size`(보이는 항목 수)는 쓰지 않는다. SearchField와 같이 디자인 사양의 크기 이름으로 덮는다. */
type SelectProps = Omit<ComponentPropsWithoutRef<"select">, "size"> & {
  error?: boolean;
  size?: SelectSize;
};

/* sm은 발송정보 표·일괄 조작 바의 `btn_courier`(164×36) 사양이다. SearchField의 sm과 같은
   36px 컨트롤 줄에 서고, 표 안에 들어가야 해서 md(52px)로는 행이 과하게 높아진다.
   md는 폼 화면(회원가입·LIVE 생성)의 기존 사양이라 그대로 둔다. */
const sizeClasses: Record<SelectSize, string> = {
  sm: "h-9 rounded-xs",
  md: "h-13 rounded-sm",
};

const textClasses: Record<SelectSize, string> = {
  sm: "text-body-s pr-8 pl-3",
  md: "text-body-m pr-10 pl-4",
};

const caretClasses: Record<SelectSize, string> = {
  sm: "right-3",
  md: "right-4",
};

export function Select({
  children,
  className,
  disabled,
  error = false,
  size = "md",
  ...props
}: SelectProps) {
  return (
    <div
      className={[
        "border-w-xs bg-layer-surface-default relative flex w-full items-center",
        sizeClasses[size],
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
          "size-full appearance-none bg-transparent outline-none",
          textClasses[size],
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
          "pointer-events-none absolute size-2 -translate-y-1/4 rotate-45",
          "border-r border-b",
          caretClasses[size],
          disabled ? "border-text-disabled" : "border-text-default",
        ].join(" ")}
      />
    </div>
  );
}
