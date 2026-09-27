import { FundingCancelDemo } from "@/features/funding-history/ui/funding-cancel-demo";
import { FundingRefundApi } from "@/features/funding-history/ui/funding-refund-api";
import { isPublicUuid } from "@/shared/lib/public-uuid";

/* 유형·사유는 처음에 비어 있다(CL_4). 발송 지연 취소는 `/cancel`로 옮겨 `?type=` 쿼리를 읽지 않는다. */
export default async function FundingReturnPage({
  params,
}: PageProps<"/my/fundings/[fundingId]/refund/new">) {
  const { fundingId } = await params;
  if (isPublicUuid(fundingId)) return <FundingRefundApi fundingId={fundingId} />;
  return <FundingCancelDemo fundingId={fundingId} variant="return" />;
}
