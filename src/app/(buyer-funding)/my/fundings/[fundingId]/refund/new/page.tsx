import { FundingCancelDemo } from "@/features/funding-history/ui/funding-cancel-demo";
import { FundingRefundApi } from "@/features/funding-history/ui/funding-refund-api";
import { returnDefaultsByQueryType } from "@/features/funding-history/model/funding-cancel";
import { isPublicUuid } from "@/shared/lib/public-uuid";

export default async function FundingReturnPage({
  params,
  searchParams,
}: PageProps<"/my/fundings/[fundingId]/refund/new">) {
  const { fundingId } = await params;
  const query = await searchParams;
  const type = query.type === "cancel" || query.type === "delay" ? query.type : "defect";
  const { returnType, reason } = returnDefaultsByQueryType[type];
  if (isPublicUuid(fundingId))
    return (
      <FundingRefundApi
        fundingId={fundingId}
        initialReturnType={returnType}
        initialReason={reason}
      />
    );
  return (
    <FundingCancelDemo
      fundingId={fundingId}
      variant="return"
      initialReturnType={returnType}
      initialReason={reason}
    />
  );
}
