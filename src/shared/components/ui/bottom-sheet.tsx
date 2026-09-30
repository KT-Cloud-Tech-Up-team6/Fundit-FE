"use client";

import { useId, useRef, useState } from "react";
import type { ComponentPropsWithoutRef, PointerEvent, ReactNode } from "react";
import { DialogBase, dialogHeaderButtonClasses } from "./dialog-base";
import { Icon } from "./icon";

/* 이만큼 움직여야 끌기로 본다. 그 전에는 탭이라 헤더 버튼의 클릭이 그대로 간다(LIVE 질문 시트와 같은 값). */
const DRAG_SLOP_PX = 5;
/* 시트 높이의 1/4(최대 120px) 넘게 끌어 내리고 놓으면 닫는다. 덜 끌면 제자리로 돌아간다(#508). */
const CLOSE_RATIO = 0.25;
const CLOSE_MAX_PX = 120;
const DESKTOP_MODAL_QUERY = "(min-width: 1200px)";

type BottomSheetBaseProps = Omit<
  ComponentPropsWithoutRef<"dialog">,
  "children" | "onClose" | "open" | "title"
> & {
  children: ReactNode;
  /** 결제처럼 모바일 시트가 넓은 화면에서는 중앙 다이얼로그가 되는 흐름에 사용한다. */
  desktopModal?: boolean;
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
  desktopModal = false,
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
  const hasTitle =
    title != null &&
    typeof title !== "boolean" &&
    (typeof title !== "string" || title.trim() !== "");
  const closeLabel = typeof title === "string" ? `${title} 닫기` : "닫기";
  const backLabel = typeof title === "string" ? `${title} 뒤로가기` : "뒤로가기";
  const drag = useRef<{
    sheet: HTMLDialogElement;
    startY: number;
    height: number;
    moved: boolean;
  } | null>(null);
  const [dragOffset, setDragOffset] = useState<number | null>(null);

  /* 핸들·제목 영역을 아래로 끌면 시트가 따라 내려오고, 충분히 끌고 놓으면 닫는다(#508).
     1200px 이상에서 가운데 창이 되는 시트는 핸들을 숨기고 끌기도 받지 않는다. */
  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || !event.isPrimary) return;
    if (desktopModal && window.matchMedia(DESKTOP_MODAL_QUERY).matches) return;
    const sheet = event.currentTarget.closest("dialog");
    if (!sheet) return;
    drag.current = {
      sheet,
      startY: event.clientY,
      height: sheet.getBoundingClientRect().height,
      moved: false,
    };
    /* 끌기 영역은 28px 남짓이라 첫 이동부터 영역을 벗어나기 쉬워, 누르는 순간 포인터를 잡는다.
       닫기·뒤로가기 버튼을 누른 경우는 잡지 않는다. 잡으면 click이 이 영역으로 가 버튼이 눌리지 않는다. */
    if (!(event.target instanceof Element && event.target.closest("button")))
      event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current) return;
    const offset = Math.max(0, event.clientY - current.startY);
    if (!current.moved) {
      if (offset < DRAG_SLOP_PX) return;
      current.moved = true;
    }
    setDragOffset(offset);
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    drag.current = null;
    if (!current?.moved) return;
    setDragOffset(null);
    const offset = Math.max(0, event.clientY - current.startY);
    if (offset >= Math.min(CLOSE_MAX_PX, current.height * CLOSE_RATIO)) {
      onClose();
      return;
    }
    /* 제자리로 돌아가는 움직임은 CSS 전환 대신 Web Animations로 준다. 리워드 선택 시트처럼 열림·닫힘
       전환을 따로 가진 시트의 transition을 덮어쓰지 않기 위해서다. */
    current.sheet.animate(
      [{ transform: `translateY(${offset}px)` }, { transform: "translateY(0)" }],
      { duration: 150, easing: "ease-out" },
    );
  }

  function cancelDrag() {
    drag.current = null;
    setDragOffset(null);
  }

  return (
    <DialogBase
      aria-labelledby={hasTitle ? titleId : undefined}
      className={[
        /* 화면 컬럼(390px, AuthShell·주문서 등)과 같은 폭. 그보다 넓은 화면에서만 가운데 정렬한다. */
        "bg-layer-surface-default mx-auto mt-auto mb-0 max-h-[90dvh] w-full max-w-[390px] p-0",
        "backdrop:bg-layer-overlay rounded-t-md",
        desktopModal &&
          "min-[1200px]:m-auto min-[1200px]:max-h-[calc(100dvh-80px)] min-[1200px]:w-147 min-[1200px]:max-w-[calc(100vw-80px)] min-[1200px]:rounded-sm",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onClose={onClose}
      open={open}
      {...dialogProps}
      /* 끄는 동안은 시트 자체 전환 없이 포인터를 바로 따라간다. */
      style={
        dragOffset === null
          ? dialogProps.style
          : { ...dialogProps.style, transform: `translateY(${dragOffset}px)`, transition: "none" }
      }
      aria-label={
        dialogProps["aria-label"] ??
        (!hasTitle && !dialogProps["aria-labelledby"] ? "바텀 시트" : undefined)
      }
    >
      <div className="flex max-h-[90dvh] flex-col">
        {/* Figma bottom_sheet(556:1188): 핸들(1206:765) 바로 아래에 제목 줄이 간격 없이 붙는다. */}
        <div
          className="shrink-0 touch-none select-none"
          onPointerCancel={cancelDrag}
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
        >
          <div
            aria-hidden
            className={["flex justify-center py-3", desktopModal && "min-[1200px]:hidden"]
              .filter(Boolean)
              .join(" ")}
          >
            <span className="h-1 w-16 rounded-full bg-[var(--charcoal-400)]" />
          </div>
          {hasTitle && (
            <div className="flex items-center justify-between px-5 py-2">
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
        </div>
        {/* 제목을 본문에 직접 그리는 시트(약관)는 그 제목 줄도 핸들 바로 아래 8px에 오게 한다(556:3024). */}
        <div className={`min-h-0 flex-1 overflow-y-auto px-5 pb-5 ${hasTitle ? "pt-5" : "pt-2"}`}>
          {children}
        </div>
        {footer && <div className="border-border-default shrink-0 border-t p-5 pt-3">{footer}</div>}
      </div>
    </DialogBase>
  );
}
