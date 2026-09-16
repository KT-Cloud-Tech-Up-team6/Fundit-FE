/* 참여/배송 내역 목록(FL_B_MY_FUND)의 화면 데이터와 순수 헬퍼.
   ponytail: Funding 상태·전이가 미확정이라(docs/OPEN_DECISIONS.md P1) 이 4개 값은
   Figma 카드 제목을 그대로 옮긴 표시용 값이지 BE 계약이 아니다. 계약이 생기면
   이 타입을 응답 enum에 맞추고 라벨·헬퍼는 그대로 재사용한다. */

export const fundingHistoryStatuses = [
  "in_progress",
  "completed",
  "shipping",
  "delivered",
] as const;

export type FundingHistoryStatus = (typeof fundingHistoryStatuses)[number];

export const fundingHistoryStatusLabel: Record<FundingHistoryStatus, string> = {
  in_progress: "펀딩 진행 중",
  completed: "펀딩 완료",
  shipping: "배송 중",
  delivered: "배송 완료",
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

const DEMO_PRODUCT = {
  creatorName: "창작자 명",
  projectTitle: "[진짜싹싹] 35,000Pa 초강력 흡입, 가볍게 끝내는 무선청소기",
  rewardOption: "[얼리버드] 가장 먼저 만나는 스타터 세트",
  rewardQuantity: 1,
  amount: 599_000,
};

export function demoFundingHistoryItems(): FundingHistoryItem[] {
  return fundingHistoryStatuses.map((status) => ({
    id: status,
    status,
    ...DEMO_PRODUCT,
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

/** 목업 상세. 목록의 id가 상태 키 그대로라 같은 id로 진입하면 해당 상태로 보인다. */
export function demoFundingDetail(fundingId: string): FundingDetail {
  const status = isFundingHistoryStatus(fundingId) ? fundingId : "in_progress";
  return {
    id: fundingId,
    status,
    ...DEMO_PRODUCT,
    orderNumber: "FD000000-000000",
    participatedAt: "2026-07-01",
    paidAt: "2026-07-03",
    optionName: "옵션 명",
  };
}
