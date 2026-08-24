import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default async function FundingDetailPage({ params }: PageProps<"/my/fundings/[fundingId]">) {
  const { fundingId } = await params;
  return (
    <PagePlaceholder
      eyebrow="Buyer · My Funding"
      title={`펀딩 관리 · ${fundingId}`}
      description="참여 정보와 현재 상태, 서버가 허용한 후속 행동을 확인합니다."
      screenIds="B-22"
      access="owner"
      sections={["펀딩 요약", "리워드 정보", "가능한 행동"]}
    />
  );
}
