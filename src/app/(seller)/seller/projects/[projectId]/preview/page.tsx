import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default async function ProjectPreviewPage({
  params,
}: PageProps<"/seller/projects/[projectId]/preview">) {
  const { projectId } = await params;
  return (
    <PagePlaceholder
      eyebrow="Seller · Project"
      title={`프로젝트 미리보기 · ${projectId}`}
      description="구매자 화면과 동일한 렌더링을 기기별 크기로 검수합니다."
      screenIds="S-07"
      access="owner seller"
      sections={["구매자 미리보기", "기기 전환", "작성 화면 복귀"]}
    />
  );
}
