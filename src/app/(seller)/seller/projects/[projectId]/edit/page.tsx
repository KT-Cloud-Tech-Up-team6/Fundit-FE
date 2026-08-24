import { PagePlaceholder } from "@/shared/components/page-placeholder";

const sections = new Set(["story", "rewards", "policy", "news", "ai-story"]);

export default async function ProjectEditPage({
  params,
  searchParams,
}: PageProps<"/seller/projects/[projectId]/edit">) {
  const { projectId } = await params;
  const query = await searchParams;
  const requested = typeof query.section === "string" ? query.section : "story";
  const section = sections.has(requested) ? requested : "story";
  return (
    <PagePlaceholder
      eyebrow="Seller · Project Editor"
      title={`프로젝트 작성 · ${projectId}`}
      description="직접 작성과 AI 스토리 생성 결과를 검토하며 섹션별로 임시저장합니다."
      screenIds="S-03~S-06"
      access="owner seller"
      sections={["편집 내비게이션", `${section} 편집`, "저장·공개 준비 상태"]}
    />
  );
}
