"use client";

import { useEffect, useRef } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

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

export function BottomSheet({
  children,
  className,
  onCancel,
  onClick,
  onClose,
  open,
  ...props
}: BottomSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  /* showModal()은 배경을 inert로 만들 뿐 문서 스크롤까지 막아주지는 않는다.
     ponytail: body overflow만 잠근다. iOS Safari는 터치 스크롤이 새는 것으로
     알려져 있으니, 실기기에서 확인되면 position:fixed + 스크롤 위치 복원으로 올린다.
     시트를 동시에 두 개 띄우는 화면이 없어 참조 카운트는 두지 않는다. */
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <dialog
      className={[
        "bg-layer-surface-default mx-auto mt-auto mb-0 max-h-[90dvh] w-full max-w-[390px] p-0",
        "backdrop:bg-layer-overlay rounded-t-md",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      /* ESC의 기본 닫기를 막고 open만 내린다. 닫는 경로를 위 effect 하나로 모아
         dialog가 먼저 닫히고 open이 true로 남는 어긋남을 없앤다. */
      onCancel={(event) => {
        onCancel?.(event);
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        onClick?.(event);
        /* backdrop 클릭은 dialog 자신을 target으로 남긴다. 내용 클릭은 자식이 받는다. */
        if (event.target === dialogRef.current) onClose();
      }}
      ref={dialogRef}
      {...props}
    >
      <div className="max-h-[90dvh] overflow-y-auto p-5">{children}</div>
    </dialog>
  );
}
