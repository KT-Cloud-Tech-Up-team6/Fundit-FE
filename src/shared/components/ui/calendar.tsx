"use client";

import { DayPicker } from "react-day-picker";
import type { DayPickerProps } from "react-day-picker";
import { ko } from "react-day-picker/locale";
import { Icon } from "./icon";

export type CalendarProps = DayPickerProps;

const navButtonClasses =
  "flex size-9 items-center justify-center rounded-xs hover:bg-layer-surface-disabled focus-visible:outline-border-primary focus-visible:outline-2 disabled:opacity-40";

/**
 * 날짜 선택 그리드 (Figma calendar organism). react-day-picker(v10)를 디자인 토큰으로 감싼다.
 * `mode`("single"/"range"/"multiple")는 호출자가 필요에 맞게 넘긴다 — 여기서 가정하지 않는다.
 */
export function Calendar({ classNames, components, locale = ko, ...props }: CalendarProps) {
  return (
    <DayPicker
      locale={locale}
      showOutsideDays
      classNames={{
        root: "text-text-default",
        months: "flex flex-col",
        month: "flex flex-col gap-3",
        month_caption: "relative flex h-9 items-center justify-center",
        caption_label: "text-body-strong",
        nav: "absolute inset-x-0 flex items-center justify-between",
        button_previous: navButtonClasses,
        button_next: navButtonClasses,
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "text-caption-m text-text-secondary w-9 font-normal",
        week: "mt-1 flex w-full",
        day: "size-9 p-0 text-center align-middle",
        day_button:
          "text-body-m flex size-9 items-center justify-center rounded-full hover:bg-layer-surface-disabled focus-visible:outline-border-primary focus-visible:outline-2",
        today: "[&>button]:font-bold",
        selected:
          "[&>button]:bg-layer-surface-primary [&>button]:text-text-inverse [&>button]:hover:bg-layer-surface-primary-hover",
        range_start: "[&>button]:bg-layer-surface-primary [&>button]:text-text-inverse",
        range_end: "[&>button]:bg-layer-surface-primary [&>button]:text-text-inverse",
        range_middle: "[&>button]:bg-layer-surface-disabled [&>button]:rounded-none",
        outside: "[&>button]:text-text-disabled",
        disabled: "[&>button]:text-text-disabled [&>button]:hover:bg-transparent",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => (
          <Icon name={orientation === "left" ? "previous" : "next"} className="size-4" />
        ),
        ...components,
      }}
      {...props}
    />
  );
}
