import { FundingDetailApi } from "@/features/funding-history/ui/funding-api";
import { FundingDetail } from "@/features/funding-history/ui/funding-detail";
import { isPublicUuid } from "@/shared/lib/public-uuid";

export default async function FundingDetailPage({ params }: PageProps<"/my/fundings/[fundingId]">) {
  const { fundingId } = await params;
  if (isPublicUuid(fundingId)) return <FundingDetailApi fundingId={fundingId} />;
  return <FundingDetail fundingId={fundingId} />;
}
