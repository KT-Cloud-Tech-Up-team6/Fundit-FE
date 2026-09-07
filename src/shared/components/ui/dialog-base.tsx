"use client";

import { useEffect, useRef } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type DialogBaseProps = Omit<ComponentPropsWithoutRef<"dialog">, "children" | "onClose" | "open"> & {
  children: ReactNode;
  onClose: () => void;
  open: boolean;
};

/**
 * 네이티브 `<dialog>`의 열림 동기화·ESC·backdrop 닫기·배경 스크롤 잠금만 담당한다.
 * 배치와 chrome은 BottomSheet(하단 시트)·Modal(중앙 다이얼로그)이 각자 갖는다.
 * 접근 가능한 이름도 강제하지 않는다. 보이는 제목 유무가 둘이 다르므로 각 래퍼가 타입으로 강제한다.
 *
 * 주의: `className`으로 `display`를 주면(예: `flex`) 닫힌 상태를 숨기는 UA 규칙
 * `dialog:not([open]) { display: none }`을 덮어써 모달이 항상 보인다. 배치는 안쪽 요소에 건다.
 */
export function DialogBase({
  children,
  className,
  onCancel,
  onClick,
  onClose,
  open,
  ...props
}: DialogBaseProps) {
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
     다이얼로그를 동시에 두 개 띄우는 화면이 없어 참조 카운트는 두지 않는다. */
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
      className={className}
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
      {children}
    </dialog>
  );
}
