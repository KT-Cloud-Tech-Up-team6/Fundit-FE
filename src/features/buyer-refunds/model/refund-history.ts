import {
  refundDefectLabels,
  refundStatusStage,
  refundTriggerLabels,
  refundTypeByTrigger,
  type RefundSummary,
} from "@/entities/refund/api/refund-api";

/** 원본 1165:16386의 유형 드롭다운 그대로다. "교환"은 대응하는 BE 트리거가 없어 항상 0건이다. */
export const refundTypeOptions = [
  { value: "전체", label: "전체" },
  { value: "취소", label: "취소" },
  { value: "교환", label: "교환" },
  { value: "환불", label: "환불" },
] as const;

export type RefundFilterType = (typeof refundTypeOptions)[number]["value"];

/** 값이 없는 자리는 빈 문자열·null로 두고 원본의 행 자체는 유지한다. */
export type RefundEntryItem = {
  product: string;
  option: string;
  price: number | null;
  quantity: number | null;
};

export type RefundEntry = {
  id: string;
  type: "취소" | "환불";
  stage: "진행 중" | "완료" | "반려";
  status: string;
  fundingNumber: string;
  title: string;
  requestedAt: string;
  completedAt: string;
  reason: string;
  rejectedReason: string;
  items: RefundEntryItem[];
  cash: number | null;
  points: number | null;
};

const emptyItem: RefundEntryItem = { product: "", option: "", price: null, quantity: null };

/* 서버는 Instant를 UTC ISO로 내려준다. 지역 시간대로 옮기면 서버·클라이언트 렌더 결과가
   갈리므로 기존 화면들과 같이 앞 10자리만 쓴다. */
function isoDate(value: string | null): string {
  return value ? value.slice(0, 10).replaceAll("-", ".") : "";
}

/** BE가 `[DEFECTIVE] 설명`으로 합쳐 저장한 사유를 유형 문구와 설명으로 되돌린다. */
export function refundReasonText(summary: RefundSummary): string {
  const raw = summary.reasonDetail?.trim() ?? "";
  const tagged = /^\[([A-Z_]+)\]\s*([\s\S]*)$/.exec(raw);
  if (tagged) {
    const label = refundDefectLabels[tagged[1]] ?? tagged[1];
    const detail = tagged[2].trim();
    return detail ? `${label} · ${detail}` : label;
  }
  return raw || (refundTriggerLabels[summary.triggerType] ?? summary.triggerType);
}

export function toRefundEntry(summary: RefundSummary): RefundEntry {
  const type = refundTypeByTrigger[summary.triggerType] ?? "환불";
  const stage = refundStatusStage(summary.status);
  const items = (summary.lineItems ?? []).map((item) => ({
    product: item.rewardName,
    /* lineItems에 옵션 필드가 없다(BE OrderSummaryClient.LineItem). 행은 남기고 값만 비운다. */
    option: "",
    price: item.unitPrice,
    quantity: item.quantity,
  }));
  return {
    id: String(summary.refundId),
    type,
    stage,
    status: `${type} ${stage}`,
    /* 원본 891:9127의 FD 형식 주문번호를 채울 필드가 계약에 없다. 자리만 남기고 비운다. */
    fundingNumber: "",
    title: summary.projectTitle ?? "",
    requestedAt: isoDate(summary.requestedAt),
    completedAt: isoDate(summary.completedAt),
    reason: refundReasonText(summary),
    rejectedReason: summary.rejectedReason ?? "",
    items: items.length ? items : [emptyItem],
    /* 환불이 끝난 건만 금액을 고지한다. 진행 중·반려는 확정 금액이 아니다. */
    cash: stage === "완료" ? summary.amount : null,
    /* 적립금 환불 금액 계약이 없어 항상 비어 있고, 기존 규칙대로 행을 숨긴다. */
    points: null,
  };
}

/** 유형과 "진행 중만 보기"를 함께 적용한다. 서버 필터가 없어 현재 페이지 안에서만 걸러진다. */
export function filterRefundEntries(
  entries: RefundEntry[],
  type: RefundFilterType,
  inProgressOnly: boolean,
): RefundEntry[] {
  return entries.filter(
    (entry) =>
      (type === "전체" || entry.type === type) && (!inProgressOnly || entry.stage === "진행 중"),
  );
}

export function refundBadgeVariant(entry: RefundEntry): "warning" | "neutral" {
  return entry.stage === "진행 중" ? "warning" : "neutral";
}
