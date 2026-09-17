/* 참여/배송 내역 목록(FL_B_MY_FUND)의 화면 데이터와 순수 헬퍼.
   ponytail: Funding 상태·전이가 미확정이라(docs/OPEN_DECISIONS.md P1) 이 4개 값은
   Figma 카드 제목을 그대로 옮긴 표시용 값이지 BE 계약이 아니다. 계약이 생기면
   이 타입을 응답 enum에 맞추고 라벨·헬퍼는 그대로 재사용한다. */

export const fundingHistoryStatuses = [
  "in_progress",
  "completed",
  "production",
  "shipping",
  "delivered",
] as const;

export type FundingHistoryStatus = (typeof fundingHistoryStatuses)[number];

export const fundingHistoryStatusLabel: Record<FundingHistoryStatus, string> = {
  in_progress: "펀딩 진행 중",
  completed: "펀딩 완료",
  production: "제작 중",
  shipping: "배송 중",
  delivered: "배송 완료",
};

export const fundingPeriodOptions = [
  { value: "1m", label: "최근 한 달" },
  { value: "3m", label: "최근 3개월" },
  { value: "6m", label: "최근 6개월" },
  { value: "1y", label: "최근 1년" },
  { value: "custom", label: "기간 선택" },
] as const;

export type FundingPeriod = (typeof fundingPeriodOptions)[number]["value"];

export type FundingPeriodRange = {
  startDate?: string;
  endDate?: string;
  /** 테스트·목업에서 기준일을 고정할 때 쓴다. `yyyy-mm-dd` 형식이다. */
  referenceDate?: string;
};

export type FundingHistoryAction = {
  label: string;
  href: string;
};

export type FundingHistoryItem = {
  id: string;
  status: FundingHistoryStatus;
  creatorName: string;
  projectTitle: string;
  rewardOption: string;
  rewardQuantity: number;
  amount: number;
  /** `yyyy-mm-dd`. */
  paidAt: string;
  imageSrc: string;
};

export function formatWon(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

/** 상태별 카드 액션 버튼. Figma 4개 카드가 그린 조합을 그대로 옮긴다 — 실제 취소·환불
    가능 여부는 서버 eligibility를 따른다(docs/OPEN_DECISIONS.md). */
export function actionsForStatus(id: string, status: FundingHistoryStatus): FundingHistoryAction[] {
  const fulfillment: FundingHistoryAction = {
    label: "제작·배송 현황",
    href: `/my/fundings/${id}/fulfillment`,
  };
  switch (status) {
    case "in_progress":
    case "completed":
      return [{ label: "펀딩 취소", href: `/my/fundings/${id}/cancel` }, fulfillment];
    case "production":
    case "shipping":
      return [fulfillment];
    case "delivered":
      return [
        { label: "펀딩 환불", href: `/my/fundings/${id}/refund/new?type=cancel` },
        fulfillment,
      ];
  }
}

/** 검색어(제목)와 상태 필터를 함께 적용한 목록. */
export function filterFundingHistory(
  items: FundingHistoryItem[],
  query: string,
  status: FundingHistoryStatus | "all",
): FundingHistoryItem[] {
  const keyword = query.trim().toLowerCase();
  return items.filter((item) => {
    const matchesStatus = status === "all" || item.status === status;
    const matchesKeyword =
      keyword.length === 0 || item.projectTitle.toLowerCase().includes(keyword);
    return matchesStatus && matchesKeyword;
  });
}

/** 결제일을 선택 기간 안에 포함하는 카드만 남긴다. 날짜는 `yyyy-mm-dd`라 문자열 비교가 가능하다. */
export function filterFundingHistoryByPeriod(
  items: FundingHistoryItem[],
  period: FundingPeriod,
  {
    startDate,
    endDate,
    referenceDate = new Date().toISOString().slice(0, 10),
  }: FundingPeriodRange = {},
): FundingHistoryItem[] {
  if (period === "custom") {
    return items.filter(
      (item) => (!startDate || item.paidAt >= startDate) && (!endDate || item.paidAt <= endDate),
    );
  }

  const reference = new Date(`${referenceDate}T00:00:00`);
  const monthCount = period === "1m" ? 1 : period === "3m" ? 3 : period === "6m" ? 6 : 12;
  reference.setMonth(reference.getMonth() - monthCount);
  const periodStart = reference.toISOString().slice(0, 10);
  return items.filter((item) => item.paidAt >= periodStart && item.paidAt <= referenceDate);
}

/* Figma FL_B_MY_FUND_CL_1(1165:16434) 카드 4개를 그대로 옮긴 값이다.
   ponytail: "production"(제작 중)은 Figma에 예시 카드가 없어 기존 placeholder 상품으로 채운다. */
const FUNDING_HISTORY_DEMO: Record<
  FundingHistoryStatus,
  Omit<FundingHistoryItem, "id" | "status">
> = {
  in_progress: {
    creatorName: "벨라포뮬라",
    projectTitle: "탄탄하고 촉촉한 피부를 위한 데일리 콜라겐 크림",
    rewardOption: "콜라겐 크림 1개 + 미니 선크림 증정",
    rewardQuantity: 1,
    amount: 32_000,
    paidAt: "2026-09-15",
    imageSrc: "/images/funding-history/collagen-cream.png",
  },
  completed: {
    creatorName: "테크메이트 스튜디오",
    projectTitle: "아이패드를 노트북처럼, 슬림한 키보드 케이스",
    rewardOption: "키보드 케이스 + 펜슬 홀더",
    rewardQuantity: 1,
    amount: 89_000,
    paidAt: "2026-09-05",
    imageSrc: "/images/funding-history/keyboard-case.png",
  },
  production: {
    creatorName: "창작자 명",
    projectTitle: "[진짜싹싹] 35,000Pa 초강력 흡입, 가볍게 끝내는 무선청소기",
    rewardOption: "[얼리버드] 가장 먼저 만나는 스타터 세트",
    rewardQuantity: 1,
    amount: 599_000,
    paidAt: "2026-08-30",
    imageSrc: "/images/funding-history/keyboard-case.png",
  },
  shipping: {
    creatorName: "키친모먼트",
    projectTitle: "빠른 가열과 깔끔한 디자인의 스테인리스 전기주전자",
    rewardOption: "전기주전자 단품",
    rewardQuantity: 1,
    amount: 79_000,
    paidAt: "2026-08-27",
    imageSrc: "/images/funding-history/kettle.png",
  },
  delivered: {
    creatorName: "센트모먼트",
    projectTitle: "하루 종일 은은하게 퍼지는 데일리 바디미스트",
    rewardOption: "바디미스트 2종 세트",
    rewardQuantity: 1,
    amount: 24_000,
    paidAt: "2026-08-18",
    imageSrc: "/images/funding-history/body-mist.png",
  },
};

export function demoFundingHistoryItems(): FundingHistoryItem[] {
  // 최신 Figma 목록은 제작 중 예시를 포함하지 않은 네 개의 카드로 구성된다.
  return (["in_progress", "completed", "shipping", "delivered"] as const).map((status) => ({
    id: status,
    status,
    ...FUNDING_HISTORY_DEMO[status],
  }));
}

export type FundingDetail = FundingHistoryItem & {
  orderNumber: string;
  /** `yyyy-mm-dd`. */
  participatedAt: string;
  /** `yyyy-mm-dd`. */
  paidAt: string;
  optionName: string;
};

/** `yyyy-mm-dd` → `yyyy.mm.dd`. 형식이 다르면 원문을 그대로 돌려준다. */
export function formatDate(date: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  return match ? `${match[1]}.${match[2]}.${match[3]}` : date;
}

function isFundingHistoryStatus(value: string): value is FundingHistoryStatus {
  return (fundingHistoryStatuses as readonly string[]).includes(value);
}

/** 목업 상세. 목록의 id가 상태 키 그대로라 같은 id로 진입하면 해당 상태로 보인다.
    참여 일·결제 일은 Figma FL_B_MY_FUND_MNG처럼 결제 일과 같은 날로 둔다. */
export function demoFundingDetail(fundingId: string): FundingDetail {
  const status = isFundingHistoryStatus(fundingId) ? fundingId : "in_progress";
  const demo = FUNDING_HISTORY_DEMO[status];
  return {
    id: fundingId,
    status,
    ...demo,
    orderNumber: "FD000000-000000",
    participatedAt: demo.paidAt,
    optionName: "옵션 명",
  };
}
