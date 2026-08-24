import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default async function ShippingPage({
  params,
}: PageProps<"/seller/projects/[projectId]/shipping">) {
  const { projectId } = await params;
  return (
    <PagePlaceholder
      eyebrow="Seller · Shipping"
      title={`발송 정보 · ${projectId}`}
      description="택배사·운송장 번호·발송 상태를 등록하고 구매자 펀딩 내역과 연동합니다."
      screenIds="S-16"
      access="owner seller"
      sections={["택배사", "운송장", "발송 상태"]}
    />
  );
}
