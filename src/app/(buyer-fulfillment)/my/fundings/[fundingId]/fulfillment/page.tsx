import { BuyerFulfillmentApi } from "@/features/fulfillment-tracking/ui/buyer-fulfillment-api";
import { BuyerFulfillmentSummary } from "@/features/fulfillment-tracking/ui/buyer-fulfillment-summary";

export default async function FundingFulfillmentPage({
  params,
}: PageProps<"/my/fundings/[fundingId]/fulfillment">) {
  const { fundingId } = await params;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(fundingId))
    return <BuyerFulfillmentApi fundingId={fundingId} />;
  return <BuyerFulfillmentSummary fundingId={fundingId} />;
}
