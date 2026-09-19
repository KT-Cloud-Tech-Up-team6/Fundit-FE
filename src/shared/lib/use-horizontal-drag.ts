"use client";

import { useRef, type HTMLAttributes, type PointerEvent } from "react";

export function useHorizontalDrag(): HTMLAttributes<HTMLElement> {
  const gesture = useRef<{ id: number; x: number; left: number; snap: string } | null>(null);
  const dragged = useRef(false);

  function finish(event: PointerEvent<HTMLElement>) {
    const start = gesture.current;
    if (!start || start.id !== event.pointerId) return;
    event.currentTarget.style.scrollSnapType = start.snap;
    delete event.currentTarget.dataset.dragging;
    gesture.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return {
    onPointerDown(event) {
      dragged.current = false;
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      gesture.current = {
        id: event.pointerId,
        x: event.clientX,
        left: event.currentTarget.scrollLeft,
        snap: event.currentTarget.style.scrollSnapType,
      };
    },
    onPointerMove(event) {
      const start = gesture.current;
      if (!start || start.id !== event.pointerId) return;
      const distance = event.clientX - start.x;
      if (!dragged.current && Math.abs(distance) < 6) return;
      if (!dragged.current) {
        dragged.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        event.currentTarget.style.scrollSnapType = "none";
        event.currentTarget.dataset.dragging = "true";
      }
      event.preventDefault();
      event.currentTarget.scrollLeft = start.left - distance;
    },
    onPointerUp: finish,
    onPointerCancel: finish,
    onLostPointerCapture: finish,
    onPointerLeave(event) {
      if (!dragged.current) finish(event);
    },
    onDragStart(event) {
      event.preventDefault();
    },
    onClickCapture(event) {
      if (dragged.current && event.detail !== 0) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
  };
}
