import { BuyerFulfillmentHistory } from "@/features/fulfillment-tracking/ui/buyer-fulfillment-history";

export default async function FundingFulfillmentHistoryPage({
  params,
}: PageProps<"/my/fundings/[fundingId]/fulfillment/history">) {
  const { fundingId } = await params;
  return <BuyerFulfillmentHistory fundingId={fundingId} />;
}
