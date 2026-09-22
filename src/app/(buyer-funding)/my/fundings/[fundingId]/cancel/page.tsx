import { FundingDetailApi } from "@/features/funding-history/ui/funding-api";
import { FundingCancelDemo } from "@/features/funding-history/ui/funding-cancel-demo";
import { isPublicUuid } from "@/shared/lib/public-uuid";

export default async function FundingCancelPage({
  params,
}: PageProps<"/my/fundings/[fundingId]/cancel">) {
  const { fundingId } = await params;
  if (isPublicUuid(fundingId)) return <FundingDetailApi fundingId={fundingId} cancel />;
  return <FundingCancelDemo fundingId={fundingId} />;
}
