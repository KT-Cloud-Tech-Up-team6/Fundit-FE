import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default async function SellerFulfillmentPage({
  params,
}: PageProps<"/seller/projects/[projectId]/fulfillment">) {
  const { projectId } = await params;
  return (
    <PagePlaceholder
      eyebrow="Seller · Fulfillment"
      title={`제작·배송 관리 · ${projectId}`}
      description="5단계 진행 상태와 일정·상세 업데이트를 구매자 화면과 연결합니다."
      screenIds="S-14"
      access="owner seller"
      sections={["5단계 편집", "예상 일정", "주간 업데이트"]}
    />
  );
}
