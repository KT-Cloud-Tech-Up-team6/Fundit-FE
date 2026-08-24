import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default async function FundingFulfillmentPage({
  params,
}: PageProps<"/my/fundings/[fundingId]/fulfillment">) {
  const { fundingId } = await params;
  return (
    <PagePlaceholder
      eyebrow="Buyer · Fulfillment"
      title={`제작·배송 현황 · ${fundingId}`}
      description="제작 착수부터 배송까지 단계·예정일·지연 사유를 확인합니다."
      screenIds="B-23"
      access="owner"
      sections={["5단계 타임라인", "지연 안내", "배송 조회"]}
    />
  );
}
