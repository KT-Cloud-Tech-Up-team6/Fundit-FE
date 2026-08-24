import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default async function CheckoutPage({ params }: PageProps<"/funding/[projectId]/checkout">) {
  const { projectId } = await params;
  return (
    <PagePlaceholder
      eyebrow="Buyer · Funding 2/3"
      title={`주문서 · ${projectId}`}
      description="배송지·쿠폰·최종 금액을 검토하고 가격과 재고를 재검증합니다."
      screenIds="B-18"
      access="member + selection"
      sections={["배송지", "쿠폰", "주문 요약"]}
    />
  );
}
