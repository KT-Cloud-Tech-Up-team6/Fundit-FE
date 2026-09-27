/* 주문서 결제 금액(Figma FL_B_PY_ORD_1 `section_payment_summary`)의 표시 줄. 데모는 목업 요약으로
   계산하고, 실제 주문서는 BE 주문 미리보기 값을 그대로 옮긴다. */
import type { OrderPreview } from "../../../entities/order/api/order-api";
import {
  finalPaymentAmount,
  totalDiscount,
  totalOrderAmount,
  type PaymentSummary,
} from "./checkout-demo";

export type SummaryLine = { label: string; amount: number };

/** 묶음마다 첫 줄이 합계이고 나머지는 "ㄴ" 세부 줄이다. 할인은 양수로 두고 화면에서 "-"를 붙인다. */
export type SummaryRows = { order: SummaryLine[]; discount: SummaryLine[]; finalAmount: number };

export function demoSummaryRows(summary: PaymentSummary): SummaryRows {
  return {
    order: [
      { label: "총 주문 금액", amount: totalOrderAmount(summary) },
      { label: "ㄴ펀딩 금액", amount: summary.fundingAmount },
      { label: "ㄴ배송비", amount: summary.shippingFee },
    ],
    discount: [
      { label: "총 할인 금액", amount: totalDiscount(summary) },
      { label: "ㄴ얼리버드 할인", amount: summary.earlyBirdDiscount ?? 0 },
      { label: "ㄴ쿠폰 사용", amount: summary.couponDiscount },
      { label: "ㄴ보유 적립금 사용", amount: summary.pointDiscount },
    ],
    finalAmount: finalPaymentAmount(summary),
  };
}

/** 실제 주문서(노션 FE 자체 판단 80). BE 할인은 쿠폰만이라 할인 합계와 쿠폰 사용이 같다.
    얼리버드 할인은 BE가 계산하지 않고(PM·BE 확인 중), 적립금은 구현 제외라 줄을 두지 않는다. */
export function previewSummaryRows(preview: OrderPreview): SummaryRows {
  return {
    order: [
      { label: "총 주문 금액", amount: preview.rewardAmount + preview.shippingFee },
      { label: "ㄴ펀딩 금액", amount: preview.rewardAmount },
      { label: "ㄴ배송비", amount: preview.shippingFee },
    ],
    discount: [
      { label: "총 할인 금액", amount: preview.discountAmount },
      { label: "ㄴ쿠폰 사용", amount: preview.discountAmount },
    ],
    finalAmount: preview.finalAmount,
  };
}
