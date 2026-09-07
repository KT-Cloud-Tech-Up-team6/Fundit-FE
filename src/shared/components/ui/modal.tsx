"use client";

import { useId } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { DialogBase } from "./dialog-base";
import { Icon } from "./icon";

type ModalProps = Omit<
  ComponentPropsWithoutRef<"dialog">,
  "children" | "onClose" | "open" | "title"
> & {
  children: ReactNode;
  onClose: () => void;
  open: boolean;
  /** 헤더에 보이는 제목이자 dialog의 접근 가능한 이름. 둘을 분리하지 않는다. */
  title: ReactNode;
};

/**
 * PC 중앙 다이얼로그. 헤더(제목 + 닫기)만 갖고 본문 구성은 호출자가 소유한다.
 * 높이는 화면마다 달라 고정하지 않는다. 필요하면 `className`으로 준다.
 */
export function Modal({ children, className, onClose, open, title, ...props }: ModalProps) {
  const titleId = useId();

  return (
    <DialogBase
      aria-labelledby={titleId}
      className={[
        "bg-layer-surface-default m-auto max-h-[90dvh] w-147 max-w-[calc(100vw-40px)]",
        "backdrop:bg-layer-overlay rounded-sm p-0",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onClose={onClose}
      open={open}
      {...props}
    >
      <div className="flex h-full flex-col p-6">
        <div className="flex h-9 shrink-0 items-center">
          {/* 오른쪽 닫기 버튼과 같은 크기의 자리를 왼쪽에도 둬야 제목이 가운데 온다. */}
          <span aria-hidden className="size-9 shrink-0" />
          <h2 className="text-heading-m text-text-title min-w-0 flex-1 text-center" id={titleId}>
            {title}
          </h2>
          <button
            aria-label="닫기"
            className="text-text-default hover:bg-layer-surface-disabled focus-visible:outline-border-primary flex size-9 shrink-0 items-center justify-center rounded-xs focus-visible:outline-2"
            onClick={onClose}
            type="button"
          >
            <Icon name="close" className="size-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </DialogBase>
  );
}
