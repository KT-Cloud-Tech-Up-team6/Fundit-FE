import { FundingDetailApi } from "@/features/funding-history/ui/funding-api";
import { FundingCancelDemo } from "@/features/funding-history/ui/funding-cancel-demo";

export default async function FundingCancelPage({
  params,
}: PageProps<"/my/fundings/[fundingId]/cancel">) {
  const { fundingId } = await params;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(fundingId))
    return <FundingDetailApi fundingId={fundingId} cancel />;
  return <FundingCancelDemo fundingId={fundingId} />;
}
