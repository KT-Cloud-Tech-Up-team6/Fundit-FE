import Image from "next/image";
import { useId } from "react";
import type { ComponentPropsWithRef, ComponentPropsWithoutRef, ReactNode } from "react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";

/* Input이 네이티브 `size` 자리를 디자인 사양 크기로 쓰므로 여기서도 넘기지 않는다. */
type AuthInputProps = Omit<ComponentPropsWithRef<"input">, "className" | "size"> & {
  errorMessage?: string;
  onClear?: () => void;
  startAdornment?: ReactNode;
};

export function AuthInput({
  errorMessage,
  onClear,
  startAdornment,
  value,
  ...props
}: AuthInputProps) {
  const generatedId = useId();
  const errorId = errorMessage ? `${props.id ?? generatedId}-error` : undefined;
  const describedBy = [props["aria-describedby"], errorId].filter(Boolean).join(" ") || undefined;
  const hasValue = typeof value === "string" && value.length > 0;

  return (
    <div className="w-full">
      <Input
        {...props}
        aria-describedby={describedBy}
        endAdornment={
          hasValue && onClear && !props.disabled ? (
            <button
              aria-label={`${props["aria-label"] ?? "입력값"} 지우기`}
              onClick={onClear}
              type="button"
            >
              <Image alt="" height={10} src="/icons/input-clear.svg" width={10} />
            </button>
          ) : undefined
        }
        error={Boolean(errorMessage)}
        shape="compact"
        startAdornment={startAdornment}
        value={value}
      />
      {errorMessage ? (
        <p className="text-caption-s text-text-default mt-2" id={errorId} role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

type AuthButtonProps = ComponentPropsWithoutRef<typeof Button>;

export function AuthButton({ className, ...props }: AuthButtonProps) {
  return (
    <Button
      appearance="cta"
      className={["w-full", className].filter(Boolean).join(" ")}
      size="xl"
      {...props}
    />
  );
}

/* 소셜 로그인·가입 버튼은 OAuth 연동 전까지 두 화면 모두 비활성 상태로 둔다(같은 디자인). */
export function AuthSocialButton({
  icon,
  label,
  tone,
}: {
  icon: string;
  label: string;
  tone: "google" | "kakao";
}) {
  return (
    <button
      aria-label={`${label} (준비 중)`}
      className={[
        "text-body-emphasis relative flex h-13 w-full items-center justify-center rounded-xs px-4",
        tone === "kakao"
          ? "text-text-static-black shadow-light-s bg-[#fee500]"
          : "border-w-xs border-border-default bg-layer-surface-default text-text-secondary",
      ].join(" ")}
      disabled
      type="button"
    >
      <Image
        alt=""
        className={[
          "absolute left-6 object-contain",
          tone === "kakao" ? "size-[18px]" : "size-6",
        ].join(" ")}
        height={24}
        src={icon}
        width={24}
      />
      {label}
    </button>
  );
}
