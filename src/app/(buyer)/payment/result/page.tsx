import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default function PaymentResultPage() {
  return (
    <PagePlaceholder
      eyebrow="Buyer · Payment"
      title="결제 결과"
      description="브라우저 파라미터가 아닌 서버 주문 상태를 기준으로 결과를 표시합니다."
      screenIds="B-20"
      access="member"
      sections={["결제 상태", "주문 요약", "다음 행동"]}
    />
  );
}
