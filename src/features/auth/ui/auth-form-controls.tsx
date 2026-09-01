import Image from "next/image";
import type { ComponentPropsWithoutRef } from "react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";

type AuthInputProps = Omit<ComponentPropsWithoutRef<"input">, "className"> & {
  errorMessage?: string;
  onClear?: () => void;
};

export function AuthInput({ errorMessage, onClear, value, ...props }: AuthInputProps) {
  const describedBy = errorMessage && props.id ? `${props.id}-error` : undefined;
  const hasValue = typeof value === "string" && value.length > 0;

  return (
    <div className="w-full">
      <Input
        {...props}
        aria-describedby={describedBy}
        className="bg-layer-surface-disabled focus-within:border-border-primary border-transparent"
        endAdornment={
          hasValue && onClear ? (
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
        value={value}
      />
      {errorMessage ? (
        <p className="text-caption-s text-text-default mt-2" id={describedBy} role="alert">
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
      className={["!bg-layer-surface-disabled !text-text-default w-full rounded-sm", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
