import { FundingCancel } from "@/features/funding-history/ui/funding-cancel";

export default async function FundingCancelPage({
  params,
}: PageProps<"/my/fundings/[fundingId]/cancel">) {
  const { fundingId } = await params;
  return <FundingCancel fundingId={fundingId} />;
}
