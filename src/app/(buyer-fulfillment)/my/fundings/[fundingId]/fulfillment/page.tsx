import { BuyerFulfillmentApi } from "@/features/fulfillment-tracking/ui/buyer-fulfillment-api";
import { BuyerFulfillmentSummary } from "@/features/fulfillment-tracking/ui/buyer-fulfillment-summary";
import { isPublicUuid } from "@/shared/lib/public-uuid";

export default async function FundingFulfillmentPage({
  params,
}: PageProps<"/my/fundings/[fundingId]/fulfillment">) {
  const { fundingId } = await params;
  if (isPublicUuid(fundingId)) return <BuyerFulfillmentApi fundingId={fundingId} />;
  return <BuyerFulfillmentSummary fundingId={fundingId} />;
}
