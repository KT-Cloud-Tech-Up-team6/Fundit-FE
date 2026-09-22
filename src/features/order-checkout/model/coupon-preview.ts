import type { OrderPreview } from "../../../entities/order/api/order-api";

export function couponPreviewError(preview: OrderPreview, codes: string[]): string {
  if (!codes.length) return "";
  const unavailable = preview.unavailableCoupons?.find((coupon) =>
    codes.includes(coupon.couponCode),
  );
  if (unavailable) {
    const messages: Record<string, string> = {
      NOT_FOUND: "존재하지 않는 쿠폰입니다.",
      NOT_OWNED: "보유하지 않은 쿠폰입니다.",
      ALREADY_USED: "이미 사용한 쿠폰입니다.",
      EXPIRED: "사용 기간이 지난 쿠폰입니다.",
      MIN_AMOUNT_NOT_MET: "쿠폰의 최소 주문 금액을 충족하지 않습니다.",
      BUDGET_EXCEEDED: "쿠폰 할인 예산이 소진되었습니다.",
      NOT_APPLICABLE: "이 프로젝트에 사용할 수 없는 쿠폰입니다.",
    };
    return messages[unavailable.reason] ?? "이 주문에 사용할 수 없는 쿠폰입니다.";
  }
  return codes.every((code) => preview.appliedCoupons?.some((coupon) => coupon.couponCode === code))
    ? ""
    : "쿠폰 적용 여부를 확인하지 못했습니다. 다시 시도해주세요.";
}
