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

/** Figma 반품/교환 화면(1165:17336)에 그려진 배송비 예시값. 정책 확정 전까지 고정값이다. */
export const returnShippingFee = 5000;

export type RefundInfo = {
  actualRefundAmount: number;
  pointRefundAmount: number;
  cancelFee: number;
  shippingFee: number;
};

/** 취소 수수료·적립금 정책이 없어 전액 환불(수수료 0, 적립금 환불 0)만 보여준다.
    반품/교환은 배송비만큼 실 환불 금액에서 차감한다. */
export function calculateRefund(amount: number, shippingFee = 0): RefundInfo {
  return {
    actualRefundAmount: amount - shippingFee,
    pointRefundAmount: 0,
    cancelFee: 0,
    shippingFee,
  };
}

export function canSubmitCancel(reason: string): boolean {
  return reason.trim().length > 0;
}

export type CancelPhoto = {
  id: string;
  url: string;
  name: string;
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
