"use client";

import { useState } from "react";
import { BottomSheet } from "@/shared/components/ui/bottom-sheet";
import { Button } from "@/shared/components/ui/button";
import { Calendar } from "@/shared/components/ui/calendar";
import { Dropdown } from "@/shared/components/ui/dropdown";
import { SearchField } from "@/shared/components/ui/search-field";
import {
  customRangeError,
  formatDateKey,
  fundingCategoryOptions,
  fundingPeriodLabel,
  fundingPeriodOptions,
  isRelativePeriod,
  relativePeriodRange,
  type FundingCategory,
  type FundingHistoryFilter,
  type FundingPeriodRange,
} from "../model/funding-history-filter";

/** 달력 칸은 날짜만 뜻하므로 `yyyy-MM-dd`를 기기 시간대의 자정 Date로 오간다(DateField와 같다). */
function toCalendarDate(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateKey(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** 검색창(FUND_1 header_search 2323:52503)과 "총 N개"·기간·분류 드롭다운 줄(2323:52504). */
export function FundingHistoryFilters({
  count,
  filter,
  today,
  onSearch,
  onPeriodChange,
  onCategoryChange,
}: {
  /** 첫 목록을 기다리는 동안은 비워 둔다. */
  count?: number;
  filter: FundingHistoryFilter;
  /** 한국 날짜 `yyyy-MM-dd`. 최근 N개월과 직접 기간의 끝이다. */
  today: string;
  /** 앞뒤 공백을 뺀 검색어. 빈 값이면 검색어 조건을 없앤다. */
  onSearch: (q: string) => void;
  onPeriodChange: (range: FundingPeriodRange) => void;
  onCategoryChange: (category: FundingCategory) => void;
}) {
  /* 입력 중인 값은 적용된 검색어(URL)가 바뀌면 그 값으로 돌아간다. 뒤로가기로 조건이 바뀌어도 맞는다
     (통합 검색과 같은 방식). */
  const [draft, setDraft] = useState({ base: filter.q, value: filter.q });
  if (draft.base !== filter.q) setDraft({ base: filter.q, value: filter.q });
  const value = draft.base === filter.q ? draft.value : filter.q;

  return (
    <>
      {/* header_search: 좌 20·우 12·위아래 8px, search_field size=m(46px). 동작 지시가 없어 Enter로 적용한다. */}
      <form
        role="search"
        className="py-2 pr-3 pl-5"
        onSubmit={(event) => {
          event.preventDefault();
          const q = value.trim();
          setDraft({ base: filter.q, value: q });
          onSearch(q);
        }}
      >
        <SearchField
          size="md"
          name="q"
          aria-label="참여 내역 검색"
          placeholder="검색어를 입력하세요"
          enterKeyHint="search"
          value={value}
          onChange={(event) => setDraft({ base: filter.q, value: event.target.value })}
          onClear={() => setDraft({ base: filter.q, value: "" })}
        />
      </form>
      {/* header(2323:52504): "총 N개"와 기간·분류 드롭다운(2323:52507, 간격 4px). */}
      <div className="flex items-center justify-between gap-3 px-5 py-2">
        <p className="text-body-s shrink-0">{count === undefined ? "" : `총 ${count}개`}</p>
        <div className="flex min-w-0 items-center justify-end gap-1">
          <FundingPeriodFilter period={filter} today={today} onChange={onPeriodChange} />
          {/* dropdown size=xs_30(2323:52509). 목록은 FUND_3(2323:52792)에 나머지 단계를 더했다. */}
          <Dropdown
            size="xs"
            className="shrink-0"
            aria-label="분류 필터"
            value={filter.category}
            options={fundingCategoryOptions}
            onValueChange={(value) => onCategoryChange(value as FundingCategory)}
          />
        </div>
      </div>
    </>
  );
}

function FundingPeriodFilter({
  period,
  today,
  onChange,
}: {
  period: FundingPeriodRange;
  today: string;
  onChange: (range: FundingPeriodRange) => void;
}) {
  const [picking, setPicking] = useState(false);
  const label = fundingPeriodLabel(period);

  return (
    <>
      {/* dropdown size=xs_30(2323:52508). 목록 문구·순서는 FUND_2(2323:52650)다. */}
      <Dropdown
        size="xs"
        className="shrink-0"
        aria-label="기간 필터"
        value={period.period}
        valueLabel={period.period === "custom" ? label : undefined}
        options={fundingPeriodOptions}
        onValueChange={(value) => {
          if (isRelativePeriod(value)) onChange(relativePeriodRange(value, today));
          else setPicking(true);
        }}
      />
      {picking && (
        <FundingPeriodSheet
          initial={period}
          today={today}
          onCancel={() => setPicking(false)}
          onApply={(range) => {
            setPicking(false);
            onChange({ period: "custom", ...range });
          }}
        />
      )}
    </>
  );
}

type DateRange = { from: string; to: string };

/**
 * "기간 선택"의 날짜 고르기. Figma에 화면이 없어 공용 BottomSheet(1200px 이상은 중앙 모달)와 Calendar로
 * 만든다. 적용 중인 기간을 채워 열고, 시작일을 고르면 종료일로 넘어간다. 종료일은 오늘까지다.
 */
function FundingPeriodSheet({
  initial,
  today,
  onCancel,
  onApply,
}: {
  initial: DateRange;
  today: string;
  onCancel: () => void;
  onApply: (range: DateRange) => void;
}) {
  const [range, setRange] = useState<DateRange>({ from: initial.from, to: initial.to });
  const [editing, setEditing] = useState<keyof DateRange>("from");
  const [month, setMonth] = useState(() => toCalendarDate(initial.from));
  const error = customRangeError(range.from, range.to, today);
  const lastDay = toCalendarDate(today);

  function edit(field: keyof DateRange) {
    setEditing(field);
    setMonth(toCalendarDate(range[field]));
  }

  function pick(date: Date) {
    setRange((current) => ({ ...current, [editing]: toDateKey(date) }));
    if (editing === "from") setEditing("to");
  }

  return (
    <BottomSheet
      open
      title="기간 선택"
      desktopModal
      onClose={onCancel}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" appearance="cta" className="flex-1" onClick={onCancel}>
            취소
          </Button>
          <Button
            appearance="cta"
            className="flex-1"
            disabled={Boolean(error)}
            onClick={() => onApply(range)}
          >
            적용
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <RangeFieldButton
            label="시작일"
            value={range.from}
            active={editing === "from"}
            onClick={() => edit("from")}
          />
          <span aria-hidden className="text-body-s">
            ~
          </span>
          <RangeFieldButton
            label="종료일"
            value={range.to}
            active={editing === "to"}
            onClick={() => edit("to")}
          />
        </div>
        {error && (
          <p role="alert" className="text-caption-s text-text-warning">
            {error}
          </p>
        )}
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={toCalendarDate(range[editing])}
            onSelect={(date) => {
              if (date) pick(date);
            }}
            month={month}
            onMonthChange={setMonth}
            disabled={{ after: lastDay }}
            endMonth={lastDay}
          />
        </div>
      </div>
    </BottomSheet>
  );
}

function RangeFieldButton({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className="border-w-xs border-border-default aria-pressed:border-border-primary flex min-w-0 flex-1 flex-col items-start gap-0.5 rounded-xs px-3 py-2 text-left"
    >
      <span className="text-caption-m text-text-secondary">{label}</span>
      <span className="text-body-strong">{formatDateKey(value)}</span>
    </button>
  );
}
