/* 펀딩 관리 현황(FL_S_FD_STATUS)의 화면 데이터와 순수 헬퍼.
   ponytail: 펀딩 집계 API가 없어(docs/OPEN_DECISIONS.md P1) 값은 목업 상수다.
   API가 생기면 이 파일의 타입을 응답 스키마에 맞추고 포맷 헬퍼는 그대로 재사용한다. */

export type FundingPeriod = { start: string; end: string };

export type FundingSummary = {
  title: string;
  category: string;
  period: FundingPeriod;
  goalAmount: number;
  raisedAmount: number;
  backerCount: number;
  wishlistCount: number;
  openAlertCount: number;
  /** 남은 기간 배지 문구. 펀딩 상태 enum이 미확정(P1)이라 문자열 그대로 둔다. */
  dday: string;
};

export type RewardStatusRow = {
  id: string;
  name: string;
  option: string;
  quantity: number;
  amount: number;
};

/** 목표 대비 달성률(%). 목표가 0이면 0. seller-project-card와 같은 계산식. */
export function achievementRate(raisedAmount: number, goalAmount: number): number {
  return goalAmount > 0 ? Math.round((raisedAmount / goalAmount) * 100) : 0;
}

/** 5000000 → "5,000,000원" */
export function formatWon(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

/** 132 → "132명" */
export function formatPeople(value: number): string {
  return `${value.toLocaleString("ko-KR")}명`;
}

/** 100 → "100개" */
export function formatQuantity(value: number): string {
  return `${value.toLocaleString("ko-KR")}개`;
}

/** {start:"2026-07-01", end:"2026-08-12"} → "2026.07.01 - 2026.08.12".
    형식이 다르면 해당 값은 원문 그대로 잇는다. */
export function formatPeriod({ start, end }: FundingPeriod): string {
  const dot = (date: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(date) ? date.replaceAll("-", ".") : date;
  return `${dot(start)} - ${dot(end)}`;
}

export function demoFundingSummary(): FundingSummary {
  return {
    title: "친환경 소재로 만든 데일리 백",
    category: "가방",
    period: { start: "2026-07-01", end: "2026-08-12" },
    goalAmount: 5_000_000,
    raisedAmount: 6_400_000,
    backerCount: 132,
    wishlistCount: 132,
    openAlertCount: 132,
    dday: "D-NN",
  };
}

export function demoRewardRows(): RewardStatusRow[] {
  return Array.from({ length: 5 }, (_, index) => ({
    id: `reward-${index + 1}`,
    name: "리워드 이름이 얼마나 길까요 이정도?",
    option: "화이트",
    quantity: 100,
    amount: 3_200_000,
  }));
}
