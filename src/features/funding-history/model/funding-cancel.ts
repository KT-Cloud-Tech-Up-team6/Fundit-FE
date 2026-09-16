/* 참여 취소(FL_B_MY_FUND_CL)의 화면 데이터와 순수 헬퍼.
   ponytail: 배송·환불 정책이 미확정이라(docs/OPEN_DECISIONS.md P2) 취소 사유 목록은
   Figma 드롭다운이 닫힌 상태만 그려져 있어 흔한 이커머스 사유로 채운 placeholder다.
   정책이 정해지면 이 목록과 환불 계산만 바꾼다. */

export const cancelReasons = [
  "단순 변심",
  "다른 상품으로 재구매",
  "배송 지연 우려",
  "상품 정보와 다름",
  "기타",
] as const;

export type CancelReason = (typeof cancelReasons)[number];

export const cancelDetailMaxLength = 100;

export type RefundInfo = {
  actualRefundAmount: number;
  pointRefundAmount: number;
  cancelFee: number;
};

/** 취소 수수료·적립금 정책이 없어 전액 환불(수수료 0, 적립금 환불 0)만 보여준다. */
export function calculateRefund(amount: number): RefundInfo {
  return { actualRefundAmount: amount, pointRefundAmount: 0, cancelFee: 0 };
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
