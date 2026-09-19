import { PaymentResultRoute } from "@/features/order-checkout/ui/checkout-route";
import { FundingDetailApi } from "@/features/funding-history/ui/funding-api";

export default async function PaymentResultPage({ searchParams }: PageProps<"/payment/result">) {
  const { orderId } = await searchParams;
  if (
    typeof orderId === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)
  )
    return <FundingDetailApi fundingId={orderId} />;
  return <PaymentResultRoute />;
}
