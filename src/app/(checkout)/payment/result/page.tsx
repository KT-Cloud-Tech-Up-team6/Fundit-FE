import { PaymentResultRoute } from "@/features/order-checkout/ui/checkout-route";
import { FundingDetailApi } from "@/features/funding-history/ui/funding-api";
import { PaymentResultApi } from "@/features/payment-checkout/ui/payment-result-api";
import { parseResultParams } from "@/features/payment-checkout/model/payment-result";
import { isPublicUuid } from "@/shared/lib/public-uuid";

export default async function PaymentResultPage({ searchParams }: PageProps<"/payment/result">) {
  const query = await searchParams;
  // Toss 복귀(successUrl/failUrl) 쿼리가 있으면 승인·실패 처리, 없으면 주문 UUID 조회 또는 데모 완료 화면.
  const params = parseResultParams(query);
  if (params.kind !== "none") return <PaymentResultApi params={params} />;
  const { orderId } = query;
  if (typeof orderId === "string" && isPublicUuid(orderId))
    return <FundingDetailApi fundingId={orderId} />;
  return <PaymentResultRoute />;
}
