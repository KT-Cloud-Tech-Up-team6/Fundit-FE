import { BuyerFulfillmentSummary } from "@/features/fulfillment-tracking/ui/buyer-fulfillment-summary";

export default async function FundingFulfillmentPage({
  params,
}: PageProps<"/my/fundings/[fundingId]/fulfillment">) {
  const { fundingId } = await params;
  return <BuyerFulfillmentSummary fundingId={fundingId} />;
}
