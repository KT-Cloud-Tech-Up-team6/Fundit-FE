import { BuyerFulfillmentApi } from "@/features/fulfillment-tracking/ui/buyer-fulfillment-api";
import { BuyerFulfillmentHistory } from "@/features/fulfillment-tracking/ui/buyer-fulfillment-history";

export default async function FundingFulfillmentHistoryPage({
  params,
}: PageProps<"/my/fundings/[fundingId]/fulfillment/history">) {
  const { fundingId } = await params;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(fundingId))
    return <BuyerFulfillmentApi fundingId={fundingId} history />;
  return <BuyerFulfillmentHistory fundingId={fundingId} />;
}
