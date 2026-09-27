"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RefundEstimate } from "@/entities/refund/api/refund-request-api";
import { demoFundingDetail } from "../model/funding-history";
import type { ReturnRequestTarget } from "../model/funding-cancel";
import { FundingCancel } from "./funding-cancel";

/* 데모 id로 들어온 참여 취소·반품/교환 폼(FL_B_MY_FUND_CL). 실제 주문(UUID)은
   FundingCancelApi / FundingRefundApi가 처리한다. 이 경로에는 제출 계약이 없어
   확인 후 목록으로 돌아가는 것으로 갈음한다. */
export function FundingCancelDemo({
  fundingId,
  variant = "cancel",
}: {
  fundingId: string;
  variant?: "cancel" | "return";
}) {
  const router = useRouter();
  const detail = demoFundingDetail(fundingId);
  const [target, setTarget] = useState<ReturnRequestTarget | null>(null);
  const estimate =
    variant === "cancel"
      ? demoEstimate(detail.amount, null)
      : target && demoEstimate(detail.amount, target);
  return (
    <FundingCancel
      fundingId={fundingId}
      variant={variant}
      detail={{
        imageSrc: detail.imageSrc,
        projectTitle: detail.projectTitle,
        rewardOption: detail.rewardOption,
        rewardQuantity: detail.rewardQuantity,
        amount: detail.amount,
      }}
      estimate={estimate}
      onTargetChange={setTarget}
      onSubmit={() => router.push(variant === "return" ? "/my/refunds" : "/my/fundings")}
    />
  );
}

/* 목업 전용. 서버 `RefundEstimateService`가 내려줄 값을 흉내 낸다 — 구매자 귀책 반품은 반품 배송비
   5,000원을 빼고, 구매자 귀책 교환은 5,000원을 추가 결제하며, 교환·기타 하자는 확정액이 없다.
   실제 주문 화면은 이 값을 쓰지 않고 서버 응답만 표시한다. */
function demoEstimate(amount: number, target: ReturnRequestTarget | null): RefundEstimate {
  const buyerFault =
    target?.kind === "return" ||
    (target?.kind === "exchange" &&
      (target.exchangeReason === "CHANGE_OF_MIND" || target.exchangeReason === "WRONG_OPTION"));
  const returnShippingFee = target?.kind === "return" ? 5_000 : 0;
  return {
    orderId: "demo",
    paymentAmount: amount,
    rewardAmount: amount,
    shippingFee: 0,
    discountAmount: 0,
    returnShippingFee,
    additionalPaymentAmount: target?.kind === "exchange" && buyerFault ? 5_000 : 0,
    refundAmount:
      target?.kind === "exchange" || (target?.kind === "defect" && target.defectType === "OTHER")
        ? null
        : amount - returnShippingFee,
    confirmed: target === null || buyerFault,
  };
}
