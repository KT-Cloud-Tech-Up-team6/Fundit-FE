import { OrderCheckoutScreen } from "@/features/order-checkout/ui/order-checkout-screen";

/* 주문서 화면(FL_B_PY_ORD, 화면 ID B-18).
   PR1은 정적 UI + 목업 데이터. projectId 기반 주문 데이터 조회·결제 연동은 후속 이슈(#58 제외 범위). */
export default function CheckoutPage() {
  return <OrderCheckoutScreen />;
}
