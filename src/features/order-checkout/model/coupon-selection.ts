import type { CheckoutCoupon } from "@/entities/order/api/order-api";

export type CouponIssuerType = Exclude<CheckoutCoupon["issuerType"], null>;
export type CouponSelection = { couponCode: string; issuerType: CouponIssuerType };

export function selectCoupon(
  selected: CouponSelection[],
  coupon: Pick<CheckoutCoupon, "couponCode" | "issuerType">,
): CouponSelection[] {
  if (coupon.issuerType !== "PLATFORM" && coupon.issuerType !== "MAKER") return selected;
  return [
    ...selected.filter((item) => item.issuerType !== coupon.issuerType),
    { couponCode: coupon.couponCode, issuerType: coupon.issuerType },
  ];
}

export function removeCoupon(selected: CouponSelection[], couponCode: string): CouponSelection[] {
  return selected.filter((item) => item.couponCode !== couponCode);
}

export function couponCodes(selected: CouponSelection[]): string[] {
  return selected.map((item) => item.couponCode);
}
