import { FundingDetailApi } from "@/features/funding-history/ui/funding-api";
import { FundingCancel } from "@/features/funding-history/ui/funding-cancel";

export default async function FundingCancelPage({
  params,
}: PageProps<"/my/fundings/[fundingId]/cancel">) {
  const { fundingId } = await params;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(fundingId))
    return <FundingDetailApi fundingId={fundingId} cancel />;
  return <FundingCancel fundingId={fundingId} />;
}
