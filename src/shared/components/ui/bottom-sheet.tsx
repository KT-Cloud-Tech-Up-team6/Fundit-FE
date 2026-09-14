"use client";

import { useId } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { DialogBase } from "./dialog-base";
import { Icon } from "./icon";

type BottomSheetBaseProps = Omit<
  ComponentPropsWithoutRef<"dialog">,
  "children" | "onClose" | "open" | "title"
> & {
  children: ReactNode;
  onClose: () => void;
  open: boolean;
  /** 뒤로가기 버튼까지 보여줄 때만 넘긴다 (다단계 시트에서 이전 단계로 돌아갈 때). */
  onBack?: () => void;
  /* 스크롤에서 빠지고 시트 하단에 고정되는 영역. 총액·CTA처럼 항상 보여야 하는 것에 쓴다.
     없으면 예전처럼 children 하나만 스크롤한다. */
  footer?: ReactNode;
};

/* 모달에는 접근 가능한 이름이 반드시 있어야 한다. 화면에 보이는 title을 주면 그 자체가
   이름이 되고(내부에서 aria-labelledby를 자동으로 건다), 헤더 없이 스크린 리더 이름만
   필요하면 aria-label(-ledby)을 대신 준다. */
type BottomSheetProps = BottomSheetBaseProps &
  ({ title: ReactNode } | { "aria-label": string } | { "aria-labelledby": string });

const headerButtonClasses =
  "text-text-default hover:bg-layer-surface-disabled focus-visible:outline-border-primary flex size-9 shrink-0 items-center justify-center rounded-xs focus-visible:outline-2";

export function BottomSheet({
  children,
  className,
  footer,
  onBack,
  onClose,
  open,
  ...rest
}: BottomSheetProps) {
  const titleId = useId();
  const { title, ...dialogProps } = rest as Omit<
    ComponentPropsWithoutRef<"dialog">,
    "onClose" | "open"
  > & { title?: ReactNode };

  return (
    <DialogBase
      aria-labelledby={title !== undefined ? titleId : undefined}
      className={[
        /* 화면 컬럼(390px, AuthShell·주문서 등)과 같은 폭. 그보다 넓은 화면에서만 가운데 정렬한다. */
        "bg-layer-surface-default mx-auto mt-auto mb-0 max-h-[90dvh] w-full max-w-[390px] p-0",
        "backdrop:bg-layer-overlay rounded-t-md",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onClose={onClose}
      open={open}
      {...dialogProps}
    >
      {title !== undefined && (
        <div className="flex items-center justify-between px-5 py-2">
          <div className="flex min-w-0 flex-1 items-center">
            {onBack && (
              <button
                aria-label="뒤로가기"
                className={headerButtonClasses}
                onClick={onBack}
                type="button"
              >
                <Icon name="arrowLeft" className="size-5" />
              </button>
            )}
            <h2 className="text-title-m text-text-default min-w-0 flex-1 truncate" id={titleId}>
              {title}
            </h2>
          </div>
          <button aria-label="닫기" className={headerButtonClasses} onClick={onClose} type="button">
            <Icon name="close" className="size-5" />
          </button>
        </div>
      )}
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
