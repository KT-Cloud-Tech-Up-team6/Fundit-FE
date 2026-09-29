/* 펀딩 내역 목록(FL_B_MY_FUND_1 2323:52376)의 검색·기간·분류 조건과 URL(#431). 기간 문구·순서는
   FUND_2의 드롭다운(2323:52650), 분류는 FUND_3(2323:52792)에 PM 답변(2026-09-29)의 단계를 더한다.
   날짜는 모두 한국 날짜 `yyyy-MM-dd`이며 BE 목록 조건(`from`·`to`, 양 끝 포함)에 그대로 보낸다. */

export type FundingPeriod = "1m" | "3m" | "6m" | "1y" | "custom";
export type RelativePeriod = Exclude<FundingPeriod, "custom">;

export const fundingPeriodOptions: readonly { value: FundingPeriod; label: string }[] = [
  { value: "1m", label: "최근 한 달" },
  { value: "3m", label: "최근 3개월" },
  { value: "6m", label: "최근 6개월" },
  { value: "1y", label: "최근 1년" },
  { value: "custom", label: "기간 선택" },
];

const periodMonths: Record<RelativePeriod, number> = { "1m": 1, "3m": 3, "6m": 6, "1y": 12 };

/** 적용 중인 기간. 최근 N개월도 계산한 `from`·`to`를 함께 들고 있다. */
export type FundingPeriodRange = { period: FundingPeriod; from: string; to: string };

export type FundingCategory =
  | "all"
  | "in_progress"
  | "succeeded"
  | "producing"
  | "delayed"
  | "shipping"
  | "delivered"
  | "goal_failed"
  | "cancelled"
  | "payment_expired"
  | "refunded";

/* Figma FUND_3의 여섯 항목(전체~배송 완료)에 나머지 진행 단계를 더한다. PM 답변(2026-09-29)대로
   제작 중은 펀딩 성공과 발송 지연 사이, 발송 지연은 제작 중과 배송 중 사이다. value는 URL `?category=` 값이다. */
export const fundingCategoryOptions: readonly { value: FundingCategory; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "in_progress", label: "펀딩 진행 중" },
  { value: "succeeded", label: "펀딩 성공" },
  { value: "producing", label: "제작 중" },
  { value: "delayed", label: "발송 지연" },
  { value: "shipping", label: "배송 중" },
  { value: "delivered", label: "배송 완료" },
  { value: "goal_failed", label: "펀딩 목표 미달" },
  { value: "cancelled", label: "참여 취소" },
  { value: "payment_expired", label: "결제 기한 만료" },
  { value: "refunded", label: "환불 완료" },
];

/**
 * 분류마다 서버에 보낼 주문 상태(`status`, 여러 개면 합집합)와 화면이 거를 진행 단계.
 * 서버는 진행 단계로 거르지 못하므로, 목표 달성 주문의 네 단계(제작 중·발송 지연·배송 중·배송 완료)는
 * `GOAL_ACHIEVED`를 모두 받아 `progressStage`로 거른다. 펀딩 성공은 PM 정의(목표 금액 달성·목표 날짜 경과)대로
 * 목표 달성 주문 전체다. 제작 중은 BE가 `FUNDING_SUCCEEDED`를 판매자 첫 진행 기록 전후로 나눠 `IN_PRODUCTION`을
 * 더하기로 해(09-29 BE 회신, 미반영) 두 값을 함께 거른다. BE 반영 뒤 기록 없는 `FUNDING_SUCCEEDED`는 "펀딩 성공"으로 옮긴다.
 */
const categoryRules: Record<
  Exclude<FundingCategory, "all">,
  { status: string[]; stages?: readonly string[] }
> = {
  in_progress: { status: ["PENDING", "FUNDING_IN_PROGRESS"] },
  succeeded: { status: ["GOAL_ACHIEVED"] },
  producing: { status: ["GOAL_ACHIEVED"], stages: ["FUNDING_SUCCEEDED", "IN_PRODUCTION"] },
  delayed: { status: ["GOAL_ACHIEVED"], stages: ["SHIPPING_DELAYED"] },
  shipping: { status: ["GOAL_ACHIEVED"], stages: ["SHIPPING"] },
  delivered: { status: ["GOAL_ACHIEVED"], stages: ["DELIVERED"] },
  goal_failed: { status: ["GOAL_FAILED_REFUNDED"] },
  cancelled: { status: ["CANCELLED_BY_MEMBER"] },
  payment_expired: { status: ["PAYMENT_EXPIRED"] },
  refunded: { status: ["REFUNDED_AFTER_SUCCESS"] },
};

function isFundingCategory(value: string | null): value is FundingCategory {
  return value === "all" || (value !== null && Object.hasOwn(categoryRules, value));
}

/** 서버에 보낼 주문 상태. 전체면 비어 있다. */
export function categoryStatuses(category: FundingCategory): string[] {
  return category === "all" ? [] : categoryRules[category].status;
}

/** 화면이 거를 진행 단계. 서버가 거르는 분류면 없다. */
export function categoryStages(category: FundingCategory): readonly string[] | undefined {
  return category === "all" ? undefined : categoryRules[category].stages;
}

/** 서버가 준 목록 전체에서 진행 단계가 `stages` 중 하나인 주문만 남겨 `size`건씩 나눈 `page`(1부터)번째 쪽. */
export function pageByStages<T extends { progressStage: string }>(
  orders: readonly T[],
  stages: readonly string[],
  page: number,
  size: number,
): { content: T[]; totalElements: number; hasNext: boolean } {
  const matched = orders.filter((order) => stages.includes(order.progressStage));
  const start = (page - 1) * size;
  return {
    content: matched.slice(start, start + size),
    totalElements: matched.length,
    hasNext: start + size < matched.length,
  };
}

/** 화면 필터 값. `q`는 앞뒤 공백을 뺀 검색어이며 빈 값이면 서버에 보내지 않는다. */
export type FundingHistoryFilter = FundingPeriodRange & { q: string; category: FundingCategory };

/** 목록 조건. `page`는 URL과 같이 1부터다. */
export type FundingHistoryQuery = FundingHistoryFilter & { page: number };

export function isRelativePeriod(value: string | null): value is RelativePeriod {
  return value !== null && Object.hasOwn(periodMonths, value);
}

const pad = (value: number) => String(value).padStart(2, "0");

/** 실제로 있는 날짜의 `yyyy-MM-dd`인지. `2026-02-30`처럼 없는 날은 거른다. */
export function isDateKey(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

/** 달력상 N개월 전 같은 날. 그 달에 없는 날이면 말일로 당긴다(3월 31일의 한 달 전은 2월 말일). */
export function monthsBefore(dateKey: string, months: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const index = year * 12 + (month - 1) - months;
  const targetYear = Math.floor(index / 12);
  const targetMonth = index - targetYear * 12;
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  return `${targetYear}-${pad(targetMonth + 1)}-${pad(Math.min(day, lastDay))}`;
}

/** 최근 N개월: 오늘(한국 날짜)부터 N개월 전 같은 날까지. */
export function relativePeriodRange(period: RelativePeriod, today: string): FundingPeriodRange {
  return { period, from: monthsBefore(today, periodMonths[period]), to: today };
}

/** 직접 고른 기간의 오류 문구. 적용할 수 있으면 빈 문자열이다. */
export function customRangeError(from: string, to: string, today: string): string {
  if (!isDateKey(from) || !isDateKey(to)) return "시작일과 종료일을 모두 선택해 주세요.";
  if (from > to) return "시작일은 종료일보다 늦을 수 없습니다.";
  if (to > today) return "종료일은 오늘 이후로 선택할 수 없습니다.";
  return "";
}

type SearchParamsReader = { get(name: string): string | null };

/**
 * URL(`?q=&period=&from=&to=&category=&page=`)을 목록 조건으로 읽는다. 기간이 없거나 모르는 값이면
 * 최근 한 달이고, 직접 고른 기간이 잘못됐으면(없는 날짜·시작일이 늦음·종료일이 오늘 뒤) 최근 한 달로
 * 돌아간다. 분류가 없거나 모르는 값이면 전체다.
 */
export function parseFundingHistoryQuery(
  params: SearchParamsReader,
  today: string,
): FundingHistoryQuery {
  const q = params.get("q")?.trim() ?? "";
  const rawCategory = params.get("category");
  const category = isFundingCategory(rawCategory) ? rawCategory : "all";
  const rawPage = Number(params.get("page") ?? 1);
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const period = params.get("period");
  if (period === "custom") {
    const from = params.get("from") ?? "";
    const to = params.get("to") ?? "";
    if (!customRangeError(from, to, today)) return { q, category, page, period, from, to };
  }
  return {
    q,
    category,
    page,
    ...relativePeriodRange(isRelativePeriod(period) ? period : "1m", today),
  };
}

/** 조건을 URL로 쓴다. 기본값(최근 한 달·전체·1페이지·검색어 없음)은 빼고, 날짜는 직접 고른 기간일 때만 남긴다. */
export function fundingHistoryHref(query: FundingHistoryQuery): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.period !== "1m") params.set("period", query.period);
  if (query.period === "custom") {
    params.set("from", query.from);
    params.set("to", query.to);
  }
  if (query.category !== "all") params.set("category", query.category);
  if (query.page > 1) params.set("page", String(query.page));
  const text = params.toString();
  return text ? `/my/fundings?${text}` : "/my/fundings";
}

/** `yyyy-MM-dd`를 화면 표기 `yyyy.mm.dd`로 바꾼다. */
export function formatDateKey(dateKey: string): string {
  return dateKey.replaceAll("-", ".");
}

/** 기간 드롭다운에 보일 문구. 직접 고른 기간은 `yyyy.mm.dd ~ yyyy.mm.dd`다. */
export function fundingPeriodLabel(range: FundingPeriodRange): string {
  if (range.period === "custom") return `${formatDateKey(range.from)} ~ ${formatDateKey(range.to)}`;
  return fundingPeriodOptions.find((option) => option.value === range.period)?.label ?? "";
}
