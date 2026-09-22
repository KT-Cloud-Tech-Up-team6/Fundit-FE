"use client";

import { useRouter } from "next/navigation";
import { demoFundingDetail } from "../model/funding-history";
import { FundingCancel } from "./funding-cancel";

/* 데모 id로 들어온 참여 취소 폼(FL_B_MY_FUND_CL). 실제 주문(UUID)은 FundingDetailApi가
   `POST /api/v1/orders/{orderId}/cancel`로 처리한다. 이 경로에는 제출 계약이 없어
   확인 후 목록으로 돌아가는 것으로 갈음한다. */
export function FundingCancelDemo({ fundingId }: { fundingId: string }) {
  const router = useRouter();
  const detail = demoFundingDetail(fundingId);
  return (
    <FundingCancel
      fundingId={fundingId}
      detail={{
        imageSrc: detail.imageSrc,
        projectTitle: detail.projectTitle,
        rewardOption: detail.rewardOption,
        rewardQuantity: detail.rewardQuantity,
        amount: detail.amount,
      }}
      refund={{
        pointRefundAmount: 0,
        shippingFee: null,
        cancelFee: 0,
        actualRefundAmount: detail.amount,
      }}
      onSubmit={() => router.push("/my/fundings")}
    />
  );
}
