"use client";

import { useEffect, useRef, useState } from "react";
import type { FocusEvent, KeyboardEvent } from "react";
import { Calendar } from "./calendar";
import { Icon } from "./icon";

type DateFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  id?: string;
  "aria-label"?: string;
};

/** `yyyy-mm-dd` <-> 로컬 Date. 시간대 이동으로 하루가 밀리지 않게 로컬 자정으로 만든다. */
function parseValue(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : undefined;
}

function toValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDisplay(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[1]}.${match[2]}.${match[3]}` : value;
}

/** day-grid `Calendar`의 대략적인 렌더 높이(달 이동 버튼 + 6주 그리드 + padding). */
const estimatedPanelHeight = 340;

/**
 * Figma "calendar" 트리거(날짜 pill + 아이콘). `Dropdown`과 같은 뼈대(버튼 + 바깥 클릭/Escape로
 * 닫는 패널)로 day-grid `Calendar`를 감싼다. 값이 없으면 `placeholder`를 그대로 보여준다 —
 * 네이티브 `<input type="date">`는 빈 값일 때 "연도.월.일."만 띄워 이 문구를 담지 못한다.
 */
export function DateField({
  value,
  onChange,
  placeholder,
  className,
  id,
  "aria-label": ariaLabel,
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  function toggleOpen() {
    if (!open) {
      const rect = trigger.current?.getBoundingClientRect();
      /* 아래 공간이 패널보다 좁으면(모달 하단 등) 위로 열어 화면 밖으로 잘리지 않게 한다. */
      setOpenUpward(rect !== undefined && window.innerHeight - rect.bottom < estimatedPanelHeight);
    }
    setOpen((current) => !current);
  }

  useEffect(() => {
    if (!open) return;
    function handleOutsidePointer(event: PointerEvent) {
      if (event.target instanceof Node && !container.current?.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", handleOutsidePointer);
    return () => document.removeEventListener("pointerdown", handleOutsidePointer);
  }, [open]);

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }

  function handlePanelKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Escape") return;
    event.preventDefault();
    setOpen(false);
  }

  return (
    <div
      className={["relative inline-block", className].filter(Boolean).join(" ")}
      onBlur={handleBlur}
      ref={container}
    >
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={ariaLabel}
        className="border-w-xs border-border-default bg-layer-surface-default text-body-strong text-text-default focus-visible:outline-border-primary flex h-10 items-center justify-center gap-2 rounded-xs px-3 whitespace-nowrap focus-visible:outline-2"
        id={id}
        onClick={toggleOpen}
        ref={trigger}
        type="button"
      >
        <span>{value ? formatDisplay(value) : placeholder}</span>
        <Icon className="size-4" name="calendar" />
      </button>

      {open && (
        <div
          className={[
            "bg-layer-surface-default border-border-default shadow-light-m absolute left-0 z-10 rounded-xs border p-3",
            openUpward ? "bottom-full mb-2" : "top-full mt-2",
          ].join(" ")}
          onKeyDown={handlePanelKeyDown}
          role="dialog"
        >
          <Calendar
            mode="single"
            onSelect={(date) => {
              if (date) onChange(toValue(date));
              setOpen(false);
            }}
            selected={parseValue(value)}
          />
        </div>
      )}
    </div>
  );
}
