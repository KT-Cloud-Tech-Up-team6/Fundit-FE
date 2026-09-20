import { FundingDetailApi } from "@/features/funding-history/ui/funding-api";
import { FundingDetail } from "@/features/funding-history/ui/funding-detail";

export default async function FundingDetailPage({ params }: PageProps<"/my/fundings/[fundingId]">) {
  const { fundingId } = await params;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(fundingId))
    return <FundingDetailApi fundingId={fundingId} />;
  return <FundingDetail fundingId={fundingId} />;
}
