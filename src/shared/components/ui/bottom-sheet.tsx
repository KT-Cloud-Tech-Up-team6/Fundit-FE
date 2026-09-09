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
  /* 스크롤에서 빠지고 시트 하단에 고정되는 영역. 총액·CTA처럼 항상 보여야 하는 것에 쓴다.
     없으면 예전처럼 children 하나만 스크롤한다. */
  footer?: ReactNode;
};

/* 모달에는 접근 가능한 이름이 반드시 있어야 한다. 스크린 리더가 시트의 목적을 읽지
   못하는 상태로 배포되지 않도록 둘 중 하나를 타입 단계에서 강제한다. */
type BottomSheetProps = BottomSheetBaseProps &
  ({ "aria-label": string } | { "aria-labelledby": string });

export function BottomSheet({ children, className, footer, ...props }: BottomSheetProps) {
  return (
    <DialogBase
      className={[
        /* 최대 모바일 폭(480px)까지는 100%로 채우고, 그보다 넓은 화면에서만 가운데 정렬한다. */
        "bg-layer-surface-default mx-auto mt-auto mb-0 max-h-[90dvh] w-full max-w-[480px] p-0",
        "backdrop:bg-layer-overlay rounded-t-md",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {footer ? (
        /* display:flex는 dialog가 아니라 안쪽 요소에 건다(DialogBase 주석 참고).
           max-h로 높이를 묶어야 flex-1 본문이 스크롤 영역을 갖는다. */
        <div className="flex max-h-[90dvh] flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
          <div className="border-border-default shrink-0 border-t p-5 pt-3">{footer}</div>
        </div>
      ) : (
        <div className="max-h-[90dvh] overflow-y-auto p-5">{children}</div>
      )}
    </DialogBase>
  );
}
