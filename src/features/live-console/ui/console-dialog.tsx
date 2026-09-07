"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Icon } from "@/shared/components/ui/icon";
import styles from "./console.module.css";

export function ConsoleDialog({
  title,
  compact = false,
  onClose,
  children,
  footer,
}: {
  title: string;
  compact?: boolean;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    dialog?.showModal();
    headingRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={styles.dialog}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          onClose();
      }}
    >
      <div className={styles.dialogBody} style={compact ? { height: 300 } : undefined}>
        <div className="flex shrink-0 items-center gap-2">
          <span className="size-9 shrink-0" />
          <h2
            id={titleId}
            ref={headingRef}
            tabIndex={-1}
            className={`${compact ? "text-heading-s" : "text-heading-m"} flex-1 text-center`}
          >
            {title}
          </h2>
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="flex size-9 shrink-0 items-center justify-center"
          >
            <Icon name="close" className="inline-block size-5 shrink-0" />
          </button>
        </div>
        <div className={styles.dialogContent}>{children}</div>
        <div className="flex shrink-0 justify-center gap-3">{footer}</div>
      </div>
    </dialog>
  );
}
