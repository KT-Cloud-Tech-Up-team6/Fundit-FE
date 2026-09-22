import { notFound } from "next/navigation";
import { PaymentCheckoutApi } from "@/features/payment-checkout/ui/payment-checkout-api";
import { isPublicUuid } from "@/shared/lib/public-uuid";

export default async function PaymentPage({ params }: PageProps<"/payment/[orderId]">) {
  const { orderId } = await params;
  if (!isPublicUuid(orderId)) notFound();
  return <PaymentCheckoutApi orderId={orderId} />;
}
