import type { RefundDefectType, RefundEstimate } from "@/entities/refund/api/refund-request-api";

/* 참여 취소(FL_B_MY_FUND_CL)의 화면 데이터와 순수 헬퍼.
   Figma 드롭다운이 열린 상태(1165:16969, 17057, 17174)를 그대로 옮긴 실제 옵션 목록이다. */

export const cancelReasons = ["단순 변심", "결제 정보 오류", "옵션 선택 오류", "기타"] as const;

export type CancelReason = (typeof cancelReasons)[number];

/** Figma 1165:17232에 열린 유형 드롭다운 그대로 — "환불"은 별도 옵션으로 존재하지 않는다. */
export const returnTypes = ["반품", "교환"] as const;

export type ReturnType = (typeof returnTypes)[number];

/** 유형별 사유 목록. Figma 1165:17057(반품)·17174(교환)에 열린 드롭다운을 그대로 옮겼다 —
    교환 사유에는 반품에 있는 "단순변심"·"배송 지연"이 없다. */
export const returnReasonsByType: Record<ReturnType, readonly string[]> = {
  반품: [
    "단순변심",
    "불량·하자",
    "상품 파손",
    "상품이 잘못 배송됨",
    "구성품 누락",
    "배송 지연",
    "기타",
  ],
  교환: ["불량·하자", "상품 파손", "상품이 잘못 배송됨", "구성품 누락", "기타"],
};

/** `refund/new?type=` 쿼리(환불 신청 사유 카테고리)를 유형·사유 Select 초기값으로 매핑한다. */
export const returnDefaultsByQueryType: Record<
  "cancel" | "delay" | "defect",
  { returnType: ReturnType; reason: string }
> = {
  cancel: { returnType: "반품", reason: "단순변심" },
  delay: { returnType: "반품", reason: "배송 지연" },
  defect: { returnType: "반품", reason: "불량·하자" },
};

export const cancelDetailMaxLength = 100;

/** 환불 정보 영역의 값. 계약이 없어 채우지 못하는 자리는 null로 두고 행은 유지한다. */
export type RefundInfo = {
  pointRefundAmount: number | null;
  shippingFee: number | null;
  cancelFee: number | null;
  actualRefundAmount: number | null;
};

/* 적립금 환불 금액(1165:16879 인접 2382)과 취소 수수료(2404)에 대응하는 응답 필드가 없다.
   서버가 계산한 refundAmount를 그대로 고지하고 나머지는 비운다. */
export function toRefundInfo(estimate: RefundEstimate): RefundInfo {
  return {
    pointRefundAmount: null,
    shippingFee: estimate.shippingFee,
    cancelFee: null,
    actualRefundAmount: estimate.refundAmount,
  };
}

/** 원본의 유형·사유 조합을 실제 신청 계약에 대응시킨다. 없는 계약으로 치환하지 않는다. */
export type RefundSubmission =
  | { supported: true; kind: "defect"; defectType: RefundDefectType }
  | { supported: true; kind: "shipping-delay" }
  | { supported: false; reason: string };

const defectTypeByReason: Record<string, RefundDefectType> = {
  "불량·하자": "DEFECTIVE",
  "상품 파손": "DAMAGED",
};

export function refundSubmissionFor(type: ReturnType | "", reason: string): RefundSubmission {
  if (type === "교환") {
    return { supported: false, reason: "교환 신청은 아직 제공되지 않습니다." };
  }
  if (reason === "배송 지연") return { supported: true, kind: "shipping-delay" };
  const defectType = defectTypeByReason[reason];
  if (defectType) return { supported: true, kind: "defect", defectType };
  if (reason === "단순변심") {
    return { supported: false, reason: "단순변심 반품은 아직 제공되지 않습니다." };
  }
  return { supported: false, reason: `"${reason}" 사유는 아직 접수할 수 없습니다.` };
}

export function canSubmitCancel(reason: string): boolean {
  return reason.trim().length > 0;
}

export type CancelPhoto = {
  id: string;
  url: string;
  name: string;
  /** 증빙 업로드에 그대로 넘길 원본 파일. */
  file: File;
};

/** Figma에 첨부 한도가 없어 임의로 둔 값. 실제 한도가 정해지면 이 값만 바꾼다. */
export const maxCancelPhotos = 5;

export function addCancelPhotos(current: CancelPhoto[], incoming: CancelPhoto[]): CancelPhoto[] {
  const room = Math.max(0, maxCancelPhotos - current.length);
  return room > 0 ? [...current, ...incoming.slice(0, room)] : current;
}

export function removeCancelPhoto(photos: CancelPhoto[], id: string): CancelPhoto[] {
  return photos.filter((photo) => photo.id !== id);
}
