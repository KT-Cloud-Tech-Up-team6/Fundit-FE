import {
  refundReasonLabels,
  refundStatusStage,
  refundTriggerLabels,
  refundTypeByTrigger,
  type RefundSummary,
  type RefundType,
} from "@/entities/refund/api/refund-api";

/** 원본 RFND_3(2323:52976)의 유형 드롭다운(2323:53086) 그대로다. value는 URL `?type=` 값이다. */
export const refundTypeOptions = [
  { value: "all", label: "전체" },
  { value: "cancel", label: "취소" },
  { value: "exchange", label: "교환" },
  { value: "refund", label: "환불" },
] as const satisfies readonly { value: string; label: "전체" | RefundType }[];

export type RefundFilterType = (typeof refundTypeOptions)[number]["value"];

/** URL 값을 드롭다운 값으로 읽는다. 모르는 값은 필터 없음(전체)으로 본다. */
export function parseRefundFilterType(value: string | null): RefundFilterType {
  return refundTypeOptions.find((option) => option.value === value)?.value ?? "all";
}

/** 드롭다운 값을 서버에 보낼 유형으로 옮긴다. 전체는 유형 없이 보낸다. */
export function refundTypeOfFilter(filter: RefundFilterType): RefundType | undefined {
  const label = refundTypeOptions.find((option) => option.value === filter)?.label;
  return label === "전체" ? undefined : label;
}

/** 값이 없는 자리는 빈 문자열·null로 두고 원본의 행 자체는 유지한다. */
export type RefundEntryItem = {
  product: string;
  option: string;
  price: number | null;
  quantity: number | null;
};

export type RefundEntry = {
  id: string;
  type: RefundType;
  stage: "진행 중" | "완료" | "반려";
  status: string;
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
function isoDate(value: string | undefined): string {
  return value ? value.slice(0, 10).replaceAll("-", ".") : "";
}

/** 사유 유형 문구에 구매자가 쓴 상세를 잇는다. 유형이 없는 건은 상세 원문을, 둘 다 없으면
    트리거 문구를 쓴다(발송 지연·목표 미달, 사유가 저장되지 않는 참여 취소). */
export function refundReasonText(summary: RefundSummary): string {
  const detail = summary.reasonDetail?.trim() ?? "";
  if (summary.reasonType) {
    const label = refundReasonLabels[summary.reasonType] ?? summary.reasonType;
    return detail ? `${label} · ${detail}` : label;
  }
  return detail || (refundTriggerLabels[summary.triggerType] ?? summary.triggerType);
}

export function toRefundEntry(summary: RefundSummary): RefundEntry {
  const type = refundTypeByTrigger[summary.triggerType] ?? "환불";
  const stage = refundStatusStage(summary.status);
  const items = (summary.lineItems ?? []).map((item) => ({
    product: item.rewardName,
    option: item.options.map((o) => `${o.optionGroupName} ${o.optionValue}`).join(" · "),
    price: item.unitPrice,
    quantity: item.quantity,
  }));
  return {
    id: String(summary.refundId),
    type,
    stage,
    status: `${type} ${stage}`,
    title: summary.projectTitle ?? "",
    requestedAt: isoDate(summary.requestedAt),
    completedAt: isoDate(summary.completedAt),
    reason: refundReasonText(summary),
    rejectedReason: summary.rejectedReason ?? "",
    items: items.length ? items : [emptyItem],
    /* 환불이 끝난 건만 금액을 고지한다. 진행 중·반려는 확정 금액이 아니고, 교환은 환불이 없어
       amount가 결제 원금이라 실 환불 금액으로 보이면 안 된다. */
    cash: stage === "완료" && type !== "교환" ? summary.amount : null,
    /* 적립금 환불 금액 계약이 없어 항상 비어 있고, 기존 규칙대로 행을 숨긴다. */
    points: null,
  };
}

/** 원본 badge state: 진행 중은 error(주황), 완료·반려는 info(회색)다(RFND_1 2323:52821·52837). */
export function refundBadgeVariant(entry: RefundEntry): "error" | "info" {
  return entry.stage === "진행 중" ? "error" : "info";
}
