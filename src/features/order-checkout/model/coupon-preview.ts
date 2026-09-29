import type { OrderPreview } from "../../../entities/order/api/order-api";
import { formatWon } from "./checkout-demo";

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
      // 결제 금액을 0원 이하로 만드는 쿠폰(BE-8, 결제 금액 1원 이상). 문구는 BE OrderDomainApiSpec이 정했다.
      EXCEEDS_ORDER_AMOUNT: "최소 결제금액 보다 낮아 이 쿠폰을 사용할 수 없습니다",
    };
    return messages[unavailable.reason] ?? "이 주문에 사용할 수 없는 쿠폰입니다.";
  }
  return codes.every((code) => preview.appliedCoupons?.some((coupon) => coupon.couponCode === code))
    ? ""
    : "쿠폰 적용 여부를 확인하지 못했습니다. 다시 시도해주세요.";
}

/** 미리보기와 주문 생성 사이에 쿠폰이 소진·만료되면 BE #181 이전 BE는 쿠폰 없이 주문을 만든다. 생성
    응답에는 할인 상세가 없어(`OrderCreated`) 금액 비교로만 감지할 수 있다. BE #181부터는 422로 거절해
    이 경우가 생기지 않는다. FE가 먼저 배포될 때를 위해 두고, dev에서 BE #181 배포를 확인하면 지운다. */
export function couponDroppedMessage(
  hadCoupon: boolean,
  previewFinalAmount: number,
  orderFinalAmount: number,
): string | null {
  if (!hadCoupon || orderFinalAmount <= previewFinalAmount) return null;
  return `쿠폰이 적용되지 않아 결제 금액이 ${formatWon(orderFinalAmount)}으로 달라졌습니다. 확인 후 결제해주세요.`;
}
