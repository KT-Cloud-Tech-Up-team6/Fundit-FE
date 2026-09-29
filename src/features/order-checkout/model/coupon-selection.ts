import type { CheckoutCoupon } from "@/entities/order/api/order-api";

export type CouponIssuerType = Exclude<CheckoutCoupon["issuerType"], null>;
export type CouponSelection = { couponCode: string; issuerType: CouponIssuerType };

/** 같은 발급 주체의 다른 쿠폰을 이미 선택한 경우에는 함께 적용할 수 없다. */
export function hasConflictingCouponIssuer(
  selected: CouponSelection[],
  coupon: Pick<CheckoutCoupon, "couponCode" | "issuerType">,
): boolean {
  return (
    (coupon.issuerType === "PLATFORM" || coupon.issuerType === "MAKER") &&
    selected.some(
      (item) => item.issuerType === coupon.issuerType && item.couponCode !== coupon.couponCode,
    )
  );
}

export function selectCoupon(
  selected: CouponSelection[],
  coupon: Pick<CheckoutCoupon, "couponCode" | "issuerType">,
): CouponSelection[] {
  if (coupon.issuerType !== "PLATFORM" && coupon.issuerType !== "MAKER") return selected;
  if (selected.some((item) => item.couponCode === coupon.couponCode)) return selected;
  if (hasConflictingCouponIssuer(selected, coupon)) return selected;
  return [...selected, { couponCode: coupon.couponCode, issuerType: coupon.issuerType }];
}

export function removeCoupon(selected: CouponSelection[], couponCode: string): CouponSelection[] {
  return selected.filter((item) => item.couponCode !== couponCode);
}

export function couponCodes(selected: CouponSelection[]): string[] {
  return selected.map((item) => item.couponCode);
}
