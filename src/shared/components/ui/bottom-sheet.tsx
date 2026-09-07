"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { DialogBase } from "./dialog-base";

type BottomSheetBaseProps = Omit<
  ComponentPropsWithoutRef<"dialog">,
  "children" | "onClose" | "open"
> & {
  children: ReactNode;
  onClose: () => void;
  open: boolean;
};

/* 모달에는 접근 가능한 이름이 반드시 있어야 한다. 스크린 리더가 시트의 목적을 읽지
   못하는 상태로 배포되지 않도록 둘 중 하나를 타입 단계에서 강제한다. */
type BottomSheetProps = BottomSheetBaseProps &
  ({ "aria-label": string } | { "aria-labelledby": string });

export function BottomSheet({ children, className, ...props }: BottomSheetProps) {
  return (
    <DialogBase
      className={[
        "bg-layer-surface-default mx-auto mt-auto mb-0 max-h-[90dvh] w-full max-w-[390px] p-0",
        "backdrop:bg-layer-overlay rounded-t-md",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <div className="max-h-[90dvh] overflow-y-auto p-5">{children}</div>
    </DialogBase>
  );
}
