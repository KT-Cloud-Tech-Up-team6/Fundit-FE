import { apiRequest } from "../../../shared/api/client";

export type RefundLineItem = {
  rewardName: string;
  quantity: number;
  unitPrice: number;
  options: { optionGroupName: string; optionValue: string }[];
};

/* payment-service는 null인 필드를 JSON에서 뺀다(`default-property-inclusion: non_null`).
   그래서 값이 없을 수 있는 필드는 null이 아니라 키가 없는 것으로 받는다. */
export type RefundSummary = {
  refundId: number;
  fundingId: string;
  triggerType: string;
  status: string;
  /** 실행된 PG 취소액의 합, 취소 전이면 결제 원금이다. 교환은 환불이 없어 항상 결제 원금이다. */
  amount: number;
  /** `RETURN_CHANGE_OF_MIND`에만 온다. 화면(RFND)에 자리가 없어 표시하지 않는다. */
  returnShippingFee?: number;
  /** `EXCHANGE`에만 온다. 화면(RFND)에 자리가 없어 표시하지 않는다. */
  additionalPaymentAmount?: number;
  requestedAt: string;
  /** 서버가 저장값의 `[TYPE] 상세` 태그를 나눠 준 사유 유형. 태그 없는 사유면 없다. */
  reasonType?: string;
  /** 구매자가 쓴 상세만 담는다. 태그 없는 옛 저장값은 원문 그대로다. */
  reasonDetail?: string;
  rejectedReason?: string;
  completedAt?: string;
  /* order-service를 배치로 덧붙인 부가 정보라 그쪽 조회가 실패하면 목록은 내려오고
     이 두 값만 빠진다(BE RefundQueryService). 화면이 이 경우를 견뎌야 한다. */
  projectTitle?: string;
  lineItems?: RefundLineItem[];
};

export type RefundPage = {
  content: RefundSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
};

export type RefundType = "취소" | "반품" | "교환" | "환불";

/** RefundTriggerType을 유형 문구로 옮긴다. 유형 필터(전체/취소/반품/교환)도 이 묶음으로 서버에
    보낸다. 목표 미달·시스템 자동 환불은 "환불"로 두되 어느 필터에도 넣지 않는다
    (PD 회신 2026-09-28, PD-1). */
export const refundTypeByTrigger: Record<string, RefundType> = {
  SIMPLE_CHANGE_OF_MIND: "취소",
  SHIPPING_DELAY: "취소",
  RETURN_CHANGE_OF_MIND: "반품",
  DEFECT: "반품",
  EXCHANGE: "교환",
  GOAL_FAILED_AUTO: "환불",
  SYSTEM_RECONCILIATION: "환불",
};

/* v1(`/api/v1/refunds`)의 fundingId는 항상 null이라(BE RefundController 주석) v2를 쓴다.
   서버 정렬은 requestedAt 내림차순 고정이다. `inProgress=true`는 완료·반려 전 상태만 준다.
   `triggerType`은 여러 번 보내면 합집합이라, 트리거 여러 개를 묶는 유형 하나를 그대로 표현한다. */
export function getMyRefunds(
  page: number,
  filter: { inProgress: boolean; type?: RefundType },
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({ page: String(page), size: "20" });
  if (filter.inProgress) params.set("inProgress", "true");
  for (const [trigger, type] of Object.entries(refundTypeByTrigger)) {
    if (type === filter.type) params.append("triggerType", trigger);
  }
  return apiRequest<RefundPage>(`/api/v2/refunds?${params}`, { auth: true, signal });
}

/** 사유 유형이 없는 건(발송 지연·목표 미달 등)에 쓸 트리거 문구. */
export const refundTriggerLabels: Record<string, string> = {
  /* 모금 중 참여 취소 전용 트리거다. 취소 사유는 네 가지라 사유 유형 없이는 "단순 변심"으로 단정하지 않는다. */
  SIMPLE_CHANGE_OF_MIND: "참여 취소",
  SHIPPING_DELAY: "발송 지연",
  EXCHANGE: "교환",
  DEFECT: "상품 하자",
  RETURN_CHANGE_OF_MIND: "반품",
  GOAL_FAILED_AUTO: "목표 미달 자동 환불",
  SYSTEM_RECONCILIATION: "시스템 자동 환불",
};

/** 응답 `reasonType`을 09-25 신청 화면 드롭다운(CL_2·CL_5·CL_7)의 사유 문구로 옮긴다.
    취소·반품·교환이 같은 뜻의 사유를 다른 enum 이름으로 쓰므로 모두 한 표에 둔다. */
export const refundReasonLabels: Record<string, string> = {
  SIMPLE_CHANGE_OF_MIND: "단순 변심",
  CHANGE_OF_MIND: "단순 변심",
  OPTION_SELECTION_ERROR: "옵션 선택 오류",
  WRONG_OPTION: "옵션 선택 오류",
  PAYMENT_INFO_ERROR: "결제 정보 오류",
  DEFECTIVE: "불량·하자",
  DAMAGED: "상품 파손",
  WRONG_DELIVERY: "상품이 잘못 배송됨",
  MISSING_COMPONENTS: "구성품 누락",
  DIFFERENT_FROM_DESCRIPTION: "상품 설명과 다름",
  OTHER: "기타",
  ETC: "기타",
};

/** RefundRequestStatus 6종을 원본이 구분하는 세 단계로 줄인다. */
export function refundStatusStage(status: string): "진행 중" | "완료" | "반려" {
  if (status === "COMPLETED") return "완료";
  if (status === "REJECTED") return "반려";
  return "진행 중";
}
