import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default async function FundingCancelPage({
  params,
}: PageProps<"/my/fundings/[fundingId]/cancel">) {
  const { fundingId } = await params;

  return (
    <PagePlaceholder
      eyebrow="Buyer · Funding"
      title={`펀딩 취소 · ${fundingId}`}
      description="취소 가능 여부와 환불·재고 반영 내용을 확인합니다."
      screenIds="FL_B_MY_FUND_CL"
      access="owner + eligible"
      sections={["취소 가능 여부", "환불 안내", "재고 반영 안내"]}
    />
  );
}
