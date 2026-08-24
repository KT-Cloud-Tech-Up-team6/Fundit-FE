import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default async function SellerCommunityPage({
  params,
}: PageProps<"/seller/projects/[projectId]/community">) {
  const { projectId } = await params;
  return (
    <PagePlaceholder
      eyebrow="Seller · Community"
      title={`문의 관리 · ${projectId}`}
      description="질문·응원 게시물을 분류하고 미답변 문의에 답변합니다."
      screenIds="S-13"
      access="owner seller"
      sections={["문의 필터", "미답변 목록", "답변 작성"]}
    />
  );
}
