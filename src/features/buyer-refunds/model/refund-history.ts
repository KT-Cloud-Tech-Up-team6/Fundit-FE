import {
  refundReasonLabels,
  refundStatusStage,
  refundTriggerLabels,
  refundTypeByTrigger,
  type RefundSummary,
  type RefundType,
} from "@/entities/refund/api/refund-api";
/* 서버 Instant(UTC ISO)를 펀딩 내역과 같은 한국 날짜로 옮긴다. 시간대를 Asia/Seoul로 고정해
   서버·클라이언트 렌더 결과가 같다(#388: 앞 10자리를 쓰면 한국 시간 새벽 건이 하루 전으로 보였다). */
import { formatKoreanDate } from "@/features/funding-history/model/funding-history";

/** 유형 드롭다운. Figma(`2323:53086`)는 "취소/교환/환불"이지만 PD 회신(2026-09-28, PD-1)으로
    "취소/반품/교환"으로 바꾼다. value는 URL `?type=` 값이다. */
export const refundTypeOptions = [
  { value: "all", label: "전체" },
  { value: "cancel", label: "취소" },
  { value: "return", label: "반품" },
  { value: "exchange", label: "교환" },
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

/** 사유 유형 문구에 구매자가 쓴 상세를 잇는다. 유형이 없는 건은 상세 원문을, 둘 다 없으면
    트리거 문구를 쓴다(발송 지연·목표 미달, BE #181 전에 사유 없이 저장된 참여 취소).
    BE #181 뒤의 참여 취소는 v2가 나눠 준 `reasonType`(SIMPLE_CHANGE_OF_MIND·PAYMENT_INFO_ERROR·
    OPTION_SELECTION_ERROR·ETC)과 상세로 오므로 첫 분기에서 사유 문구가 된다. */
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
    requestedAt: formatKoreanDate(summary.requestedAt),
    completedAt: formatKoreanDate(summary.completedAt),
    reason: refundReasonText(summary),
    rejectedReason: summary.rejectedReason ?? "",
    items: items.length ? items : [emptyItem],
    /* 환불이 끝난 건만 금액을 고지한다. 진행 중·반려는 확정 금액이 아니고, 교환은 환불이 없다.
       교환 amount는 BE #181부터 0이고 그 전 기록은 결제 원금이라, 어느 쪽도 실 환불 금액으로 보이지 않는다. */
    cash: stage === "완료" && type !== "교환" ? summary.amount : null,
    /* 적립금 환불 금액 계약이 없어 항상 비어 있고, 기존 규칙대로 행을 숨긴다. */
    points: null,
  };
}

/** 원본 badge state: 진행 중은 error(주황), 완료·반려는 info(회색)다(RFND_1 2323:52821·52837). */
export function refundBadgeVariant(entry: RefundEntry): "error" | "info" {
  return entry.stage === "진행 중" ? "error" : "info";
}
