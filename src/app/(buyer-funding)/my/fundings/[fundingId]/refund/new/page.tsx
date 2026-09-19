import { FundingCancel } from "@/features/funding-history/ui/funding-cancel";
import { returnDefaultsByQueryType } from "@/features/funding-history/model/funding-cancel";

export default async function FundingReturnPage({
  params,
  searchParams,
}: PageProps<"/my/fundings/[fundingId]/refund/new">) {
  const { fundingId } = await params;
  const query = await searchParams;
  const type = query.type === "cancel" || query.type === "delay" ? query.type : "defect";
  const { returnType, reason } = returnDefaultsByQueryType[type];
  return (
    <FundingCancel
      fundingId={fundingId}
      variant="return"
      initialReturnType={returnType}
      initialReason={reason}
    />
  );
}
