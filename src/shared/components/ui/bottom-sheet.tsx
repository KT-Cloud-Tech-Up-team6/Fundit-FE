"use client";

import { useId } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { DialogBase, dialogHeaderButtonClasses } from "./dialog-base";
import { Icon } from "./icon";

type BottomSheetBaseProps = Omit<
  ComponentPropsWithoutRef<"dialog">,
  "children" | "onClose" | "open" | "title"
> & {
  children: ReactNode;
  onClose: () => void;
  open: boolean;
  /* 스크롤에서 빠지고 시트 하단에 고정되는 영역. 총액·CTA처럼 항상 보여야 하는 것에 쓴다.
     없으면 예전처럼 children 하나만 스크롤한다. */
  footer?: ReactNode;
};

/* 모달에는 접근 가능한 이름이 반드시 있어야 한다. 화면에 보이는 title을 주면 그 자체가
   이름이 되고(내부에서 aria-labelledby를 자동으로 건다), 헤더 없이 스크린 리더 이름만
   필요하면 aria-label(-ledby)을 대신 준다. onBack은 헤더(title) 없이는 놓일 자리가 없어
   title 쪽 분기에만 둔다 — title 없이 넘기면 타입 에러로 바로 드러난다. */
type BottomSheetProps = BottomSheetBaseProps &
  (
    | { title: ReactNode; onBack?: () => void }
    | { "aria-label": string }
    | { "aria-labelledby": string }
  );

export function BottomSheet({
  children,
  className,
  footer,
  onClose,
  open,
  ...rest
}: BottomSheetProps) {
  const titleId = useId();
  const { onBack, title, ...dialogProps } = rest as Omit<
    ComponentPropsWithoutRef<"dialog">,
    "onClose" | "open"
  > & { onBack?: () => void; title?: ReactNode };
  /* title="" 처럼 빈 문자열이면 보이는 헤더도, 이름도 없는 쪽이 낫다 — 빈 제목 바를
     그리고 aria-labelledby가 빈 접근 이름을 가리키게 두지 않는다. */
  const hasTitle = title !== undefined && title !== "";
  const closeLabel = typeof title === "string" ? `${title} 닫기` : "닫기";
  const backLabel = typeof title === "string" ? `${title} 뒤로가기` : "뒤로가기";

  return (
    <DialogBase
      aria-labelledby={hasTitle ? titleId : undefined}
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
      <div className="flex max-h-[90dvh] flex-col">
        {hasTitle && (
          <div className="flex shrink-0 items-center justify-between px-5 py-2">
            <div className="flex min-w-0 flex-1 items-center">
              {onBack && (
                <button
                  aria-label={backLabel}
                  className={dialogHeaderButtonClasses}
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
            <button
              aria-label={closeLabel}
              className={dialogHeaderButtonClasses}
              onClick={onClose}
              type="button"
            >
              <Icon name="close" className="size-5" />
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="border-border-default shrink-0 border-t p-5 pt-3">{footer}</div>}
      </div>
    </DialogBase>
  );
}
