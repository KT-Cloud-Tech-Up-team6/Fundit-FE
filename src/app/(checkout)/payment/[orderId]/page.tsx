import { notFound } from "next/navigation";
import { PaymentCheckoutApi } from "@/features/payment-checkout/ui/payment-checkout-api";

export default async function PaymentPage({ params }: PageProps<"/payment/[orderId]">) {
  const { orderId } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)) notFound();
  return <PaymentCheckoutApi orderId={orderId} />;
}
