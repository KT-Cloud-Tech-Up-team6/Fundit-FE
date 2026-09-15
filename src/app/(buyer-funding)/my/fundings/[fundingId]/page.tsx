import { FundingDetail } from "@/features/funding-history/ui/funding-detail";

export default async function FundingDetailPage({ params }: PageProps<"/my/fundings/[fundingId]">) {
  const { fundingId } = await params;
  return <FundingDetail fundingId={fundingId} />;
}
