"use client";

import { useRouter } from "next/navigation";
import { demoFundingDetail } from "../model/funding-history";
import type { ReturnType } from "../model/funding-cancel";
import { FundingCancel } from "./funding-cancel";

/* 데모 id로 들어온 참여 취소·반품/교환 폼(FL_B_MY_FUND_CL). 실제 주문(UUID)은
   FundingDetailApi / FundingRefundApi가 처리한다. 이 경로에는 제출 계약이 없어
   확인 후 목록으로 돌아가는 것으로 갈음한다. */
export function FundingCancelDemo({
  fundingId,
  variant = "cancel",
  initialReturnType,
  initialReason,
}: {
  fundingId: string;
  variant?: "cancel" | "return";
  initialReturnType?: ReturnType | "";
  initialReason?: string;
}) {
  const router = useRouter();
  const detail = demoFundingDetail(fundingId);
  return (
    <FundingCancel
      fundingId={fundingId}
      variant={variant}
      initialReturnType={initialReturnType}
      initialReason={initialReason}
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
        actualRefundAmount: detail.amount,
      }}
      onSubmit={() => router.push(variant === "return" ? "/my/refunds" : "/my/fundings")}
    />
  );
}
