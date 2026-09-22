import { BuyerFulfillmentApi } from "@/features/fulfillment-tracking/ui/buyer-fulfillment-api";
import { BuyerFulfillmentHistory } from "@/features/fulfillment-tracking/ui/buyer-fulfillment-history";
import { isPublicUuid } from "@/shared/lib/public-uuid";

export default async function FundingFulfillmentHistoryPage({
  params,
}: PageProps<"/my/fundings/[fundingId]/fulfillment/history">) {
  const { fundingId } = await params;
  if (isPublicUuid(fundingId)) return <BuyerFulfillmentApi fundingId={fundingId} history />;
  return <BuyerFulfillmentHistory fundingId={fundingId} />;
}
