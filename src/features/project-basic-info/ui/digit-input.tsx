"use client";

import type { ComponentProps } from "react";
import { Input } from "@/shared/components/ui/input";
import { caretAfterDigits, editDigits, formatDigits } from "../model/basic-info-demo";

type DigitInputProps = Omit<ComponentProps<typeof Input>, "value" | "onChange"> & {
  value: string;
  onValueChange: (value: string) => void;
};

/** 숫자 문자열 `value`를 천 단위 쉼표로 보여 주고, 입력은 쉼표·앞자리 0이 없는 숫자 문자열로 돌려준다. */
export function DigitInput({ value, onValueChange, ...props }: DigitInputProps) {
  return (
    <Input
      inputMode="numeric"
      {...props}
      value={formatDigits(value)}
      onChange={(event) => {
        const input = event.currentTarget;
        const edit = editDigits(
          value,
          input.value,
          input.selectionStart ?? 0,
          (event.nativeEvent as InputEvent).inputType,
        );
        if (edit.value !== null) onValueChange(edit.value);
        // 쉼표 때문에 표시값이 바뀌면 커서가 끝으로 가므로, React가 값을 다시 넣은 직후 숫자 개수 기준으로 되돌린다.
        queueMicrotask(() => {
          const at = caretAfterDigits(input.value, edit.caret);
          input.setSelectionRange(at, at);
        });
      }}
    />
  );
}
