import type { CheckoutCoupon } from "@/entities/order/api/order-api";

function formatFundingAmount(amount: number) {
  return amount >= 10_000 && amount % 10_000 === 0
    ? `${amount / 10_000}만원`
    : `${amount.toLocaleString("ko-KR")}원`;
}

export function couponConditions(coupon: CheckoutCoupon, projectId: string) {
  const hasMinimum = Number.isSafeInteger(coupon.minFundingAmount) && coupon.minFundingAmount > 0;
  let target = "적용 대상 확인 필요";
  if (coupon.targetScope === "ALL") target = "전체 상품";
  else if (coupon.targetScope === "PROJECT" && coupon.targetRefId)
    target = coupon.targetRefId === projectId ? "현재 프로젝트 전용" : "다른 프로젝트 전용";
  else if (coupon.targetScope === "CATEGORY" && coupon.targetRefId)
    target = `${coupon.targetRefId} 카테고리 전용`;
  else if (coupon.targetScope === "MAKER" && coupon.targetRefId)
    target = "지정 판매자의 프로젝트 전용";
  const expiry = coupon.expiresAt ? new Date(coupon.expiresAt) : null;
  const date =
    expiry && Number.isFinite(expiry.getTime())
      ? new Intl.DateTimeFormat("ko-KR", {
          timeZone: "Asia/Seoul",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
          .format(expiry)
          .replace(/\. /g, ".")
          .replace(/\.$/, "")
      : null;
  return {
    condition: hasMinimum
      ? `${formatFundingAmount(coupon.minFundingAmount)} 이상 펀딩 시 사용 가능`
      : target,
    expiry: date ? `~${date} 까지사용가능` : "유효기간 확인 필요",
  };
}
