import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default async function RewardsPage({ params }: PageProps<"/funding/[projectId]/rewards">) {
  const { projectId } = await params;
  return (
    <PagePlaceholder
      eyebrow="Buyer · Funding 1/3"
      title={`리워드 선택 · ${projectId}`}
      description="리워드·옵션·수량을 선택하고 결제 예정 금액을 확인합니다."
      screenIds="B-17"
      access="member"
      sections={["리워드 목록", "옵션·수량", "금액 요약"]}
    />
  );
}
