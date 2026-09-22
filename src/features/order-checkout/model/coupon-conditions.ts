import type { CheckoutCoupon } from "@/entities/order/api/order-api";

export function couponConditions(coupon: CheckoutCoupon, projectId: string) {
  const minimum =
    typeof coupon.targetScope === "string" &&
    Number.isSafeInteger(coupon.minFundingAmount) &&
    coupon.minFundingAmount >= 0
      ? coupon.minFundingAmount === 0
        ? "최소 펀딩 금액 제한 없음"
        : `${coupon.minFundingAmount.toLocaleString("ko-KR")}원 이상 펀딩 시 사용 가능`
      : "최소 펀딩 금액 확인 필요";
  const limit =
    Number.isSafeInteger(coupon.perMemberLimit) && coupon.perMemberLimit > 0
      ? `1인당 최대 ${coupon.perMemberLimit.toLocaleString("ko-KR")}장 발급`
      : "회원당 발급 한도 확인 필요";
  let target = "적용 대상 확인 필요";
  if (coupon.targetScope === "ALL") target = "전체 프로젝트";
  else if (coupon.targetScope === "PROJECT" && coupon.targetRefId)
    target = coupon.targetRefId === projectId ? "현재 프로젝트 전용" : "다른 프로젝트 전용";
  else if (coupon.targetScope === "CATEGORY" && coupon.targetRefId)
    target = `${coupon.targetRefId} 카테고리 전용`;
  else if (coupon.targetScope === "MAKER" && coupon.targetRefId)
    target = "지정 판매자의 프로젝트 전용";
  const maximumDiscount =
    Number.isSafeInteger(coupon.maxDiscountAmount) &&
    coupon.maxDiscountAmount !== null &&
    coupon.maxDiscountAmount >= 0
      ? `최대 ${coupon.maxDiscountAmount.toLocaleString("ko-KR")}원 할인`
      : "최대 할인 금액 확인 필요";
  const expiry = coupon.expiresAt ? new Date(coupon.expiresAt) : null;
  return {
    condition: [minimum, target, limit, maximumDiscount].join("\n"),
    expiry:
      expiry && Number.isFinite(expiry.getTime())
        ? `${new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(expiry)}까지 (한국 시간)`
        : "유효기간 확인 필요",
  };
}
