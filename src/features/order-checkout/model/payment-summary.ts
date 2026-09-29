/* 주문서 결제 금액(Figma FL_B_PY_ORD_1 `section_payment_summary`)의 표시 줄. 데모는 목업 요약으로
   계산하고, 실제 주문서는 BE 주문 미리보기 값과 주문 줄의 정가로 만든다. */
import type { OrderPreview } from "../../../entities/order/api/order-api";
import { isBilledAsShown, listPriceTotal, type CheckoutLineItem } from "./checkout-lines";
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

/** 실제 주문서(노션 FE 자체 판단 80). BE #181부터 `rewardAmount`는 얼리 버드 할인가 합계라(요청서
    BE-22), Figma처럼 ㄴ펀딩 금액은 주문 줄의 정가 합계로 두고 그 차액을 ㄴ얼리버드 할인에 적는다.
    `discountAmount`는 쿠폰 할인이다. 최종 결제 금액은 다시 계산하지 않고 BE `finalAmount`를 따르며,
    적립금은 구현 제외라 줄을 두지 않는다. */
export function previewSummaryRows(preview: OrderPreview, items: CheckoutLineItem[]): SummaryRows {
  /* 줄 청구 합계가 BE 금액과 다르면 가격 차이를 할인으로 추정하지 않고 BE 금액만 쓴다(줄도 정가로 보인다). */
  const fundingAmount = isBilledAsShown(items, preview.rewardAmount)
    ? listPriceTotal(items)
    : preview.rewardAmount;
  const earlyBirdDiscount = fundingAmount - preview.rewardAmount;
  return {
    order: [
      { label: "총 주문 금액", amount: fundingAmount + preview.shippingFee },
      { label: "ㄴ펀딩 금액", amount: fundingAmount },
      { label: "ㄴ배송비", amount: preview.shippingFee },
    ],
    discount: [
      { label: "총 할인 금액", amount: earlyBirdDiscount + preview.discountAmount },
      { label: "ㄴ얼리버드 할인", amount: earlyBirdDiscount },
      { label: "ㄴ쿠폰 사용", amount: preview.discountAmount },
    ],
    finalAmount: preview.finalAmount,
  };
}
