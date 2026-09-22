import { apiRequest } from "../../../shared/api/client";

export type RefundLineItem = { rewardName: string; quantity: number; unitPrice: number };

export type RefundSummary = {
  refundId: number;
  fundingId: string;
  triggerType: string;
  status: string;
  amount: number;
  requestedAt: string;
  reasonDetail: string | null;
  rejectedReason: string | null;
  completedAt: string | null;
  /* order-service를 배치로 덧붙인 부가 정보라 그쪽 조회가 실패하면 목록은 내려오고
     이 두 값만 null이 된다(BE RefundQueryService). 화면이 이 경우를 견뎌야 한다. */
  projectTitle: string | null;
  lineItems: RefundLineItem[] | null;
};

export type RefundPage = {
  content: RefundSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
};

/* v1(`/api/v1/refunds`)의 fundingId는 항상 null이라(BE RefundController 주석) v2를 쓴다.
   서버 정렬은 requestedAt 내림차순 고정이고 유형·상태 필터 파라미터는 없다. */
export function getMyRefunds(page: number, signal?: AbortSignal) {
  return apiRequest<RefundPage>(`/api/v2/refunds?page=${page}&size=20`, { auth: true, signal });
}

/** RefundTriggerType을 원본(891:9113)의 유형 문구로 옮긴다. 교환에 해당하는 트리거는 없다. */
export const refundTypeByTrigger: Record<string, "취소" | "환불"> = {
  SIMPLE_CHANGE_OF_MIND: "취소",
  SHIPPING_DELAY: "취소",
  DEFECT: "환불",
  GOAL_FAILED_AUTO: "환불",
  SYSTEM_RECONCILIATION: "환불",
};

/** reasonDetail이 비어 오는 자동 환불 트리거에 쓸 사유 문구. */
export const refundTriggerLabels: Record<string, string> = {
  SIMPLE_CHANGE_OF_MIND: "단순 변심",
  SHIPPING_DELAY: "발송 지연",
  DEFECT: "상품 하자",
  GOAL_FAILED_AUTO: "목표 미달 자동 환불",
  SYSTEM_RECONCILIATION: "시스템 자동 환불",
};

/** BE가 reasonDetail 앞에 `[DEFECTIVE]`처럼 붙여 저장하는 하자 유형 태그. */
export const refundDefectLabels: Record<string, string> = {
  DEFECTIVE: "불량·하자",
  DAMAGED: "상품 파손",
  DIFFERENT_FROM_DESCRIPTION: "표시·광고 상이",
};

/** RefundRequestStatus 6종을 원본이 구분하는 세 단계로 줄인다. */
export function refundStatusStage(status: string): "진행 중" | "완료" | "반려" {
  if (status === "COMPLETED") return "완료";
  if (status === "REJECTED") return "반려";
  return "진행 중";
}
