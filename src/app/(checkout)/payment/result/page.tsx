import { OrderCompleteScreen } from "@/features/order-checkout/ui/order-complete-screen";

/* 결제 결과 = 주문 완료 화면(FL_B_PY_CMPL). PG 이후 랜딩.
   PR: 정적 UI + 목업 영수증. 서버 주문 상태 재조회·실패 분기는 후속. */
export default function PaymentResultPage() {
  return <OrderCompleteScreen />;
}
