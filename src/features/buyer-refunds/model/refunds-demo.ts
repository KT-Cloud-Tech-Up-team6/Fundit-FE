export const refundTypeOptions = [
  { value: "전체", label: "전체" },
  { value: "취소", label: "취소" },
  { value: "교환", label: "교환" },
  { value: "환불", label: "환불" },
] as const;

export type RefundFilterType = (typeof refundTypeOptions)[number]["value"];

export const refundHistory = [
  {
    id: "cancel-pending",
    type: "취소",
    status: "취소 진행 중",
    completedAt: "",
    cash: null,
    points: null,
    fundingNumber: "FD20260901-000123",
    title: "키친모먼트 스테인리스 전기주전자",
    requestedAt: "2026.09.01",
    reason: "단순 변심",
    product: "얼리버드 스타터 세트",
    option: "단일 옵션",
    price: 199000,
    quantity: 1,
  },
  {
    id: "cancel-complete",
    type: "취소",
    status: "취소 완료",
    completedAt: "2026.09.13",
    cash: 199000,
    points: 0,
    fundingNumber: "FD20260820-000089",
    title: "[진짜싹싹] 35,000Pa 초강력 흡입, 가볍게 끝내는 무선청소기",
    requestedAt: "2026.09.01",
    reason: "단순 변심",
    product: "얼리버드 스타터 세트",
    option: "단일 옵션",
    price: 199000,
    quantity: 1,
  },
  {
    id: "refund-complete",
    type: "환불",
    status: "환불 완료",
    completedAt: "2026.09.05",
    cash: 23000,
    points: 0,
    fundingNumber: "FD20260815-000047",
    title: "벨라포뮬라 데일리 콜라겐 크림",
    requestedAt: "2026.09.01",
    reason: "단순 변심",
    product: "데일리 콜라겐 크림",
    option: "단일 옵션",
    price: 23000,
    quantity: 1,
  },
  {
    id: "exchange-complete",
    type: "교환",
    status: "교환 완료",
    completedAt: "2026.09.05",
    cash: null,
    points: null,
    fundingNumber: "FD20260828-000162",
    title: "센트모먼트 바디미스트",
    requestedAt: "2026.09.01",
    reason: "상품 불량",
    product: "센트모먼트 바디미스트",
    option: "단일 옵션",
    price: 24000,
    quantity: 1,
  },
];

/** 유형(전체/취소/교환/환불)과 "진행 중만 보기" 토글을 함께 적용한 목록. */
export function filterRefundHistory(
  entries: typeof refundHistory,
  type: RefundFilterType,
  inProgressOnly: boolean,
): typeof refundHistory {
  return entries.filter((entry) => {
    const matchesType = type === "전체" || entry.type === type;
    const matchesProgress = !inProgressOnly || entry.status.includes("진행 중");
    return matchesType && matchesProgress;
  });
}

export function refundBadgeVariant(status: string): "warning" | "neutral" {
  return status.includes("진행 중") ? "warning" : "neutral";
}
