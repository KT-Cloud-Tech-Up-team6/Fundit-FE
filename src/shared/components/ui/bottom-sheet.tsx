"use client";

import { useEffect, useRef } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type BottomSheetProps = Omit<
  ComponentPropsWithoutRef<"dialog">,
  "children" | "onClose" | "open"
> & {
  children: ReactNode;
  onClose: () => void;
  open: boolean;
};

export function BottomSheet({ children, className, onClose, open, ...props }: BottomSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
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
      onClick={(event) => {
        /* backdrop 클릭은 dialog 자신을 target으로 남긴다. 내용 클릭은 자식이 받는다. */
        if (event.target === dialogRef.current) dialogRef.current.close();
      }}
      /* ESC, backdrop, close() 어느 경로로 닫혀도 close 이벤트가 한 번 발생한다. */
      onClose={onClose}
      ref={dialogRef}
      {...props}
    >
      <div className="max-h-[90dvh] overflow-y-auto p-5">{children}</div>
    </dialog>
  );
}
