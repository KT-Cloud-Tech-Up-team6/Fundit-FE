import { FundingCancelApi } from "@/features/funding-history/ui/funding-cancel-api";
import { FundingCancelDemo } from "@/features/funding-history/ui/funding-cancel-demo";
import { isPublicUuid } from "@/shared/lib/public-uuid";

export default async function FundingCancelPage({
  params,
}: PageProps<"/my/fundings/[fundingId]/cancel">) {
  const { fundingId } = await params;
  if (isPublicUuid(fundingId)) return <FundingCancelApi fundingId={fundingId} />;
  return <FundingCancelDemo fundingId={fundingId} />;
}
