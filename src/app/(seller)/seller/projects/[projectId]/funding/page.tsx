import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default async function SellerFundingPage({
  params,
}: PageProps<"/seller/projects/[projectId]/funding">) {
  const { projectId } = await params;
  return (
    <PagePlaceholder
      eyebrow="Seller · Funding"
      title={`펀딩 현황 · ${projectId}`}
      description="목표 달성률·참여자·찜·남은 기간과 데이터 갱신 시점을 확인합니다."
      screenIds="S-12"
      access="owner seller"
      sections={["핵심 지표", "달성률", "D-day·갱신 시점"]}
    />
  );
}
