import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default async function NewLivePage({
  params,
}: PageProps<"/seller/projects/[projectId]/live/new">) {
  const { projectId } = await params;
  return (
    <PagePlaceholder
      eyebrow="Seller · LIVE"
      title={`LIVE 생성 · ${projectId}`}
      description="프로젝트를 연결한 새 LIVE 방송을 생성합니다."
      screenIds="S-08"
      access="owner seller"
      sections={["연결 프로젝트", "LIVE 기본정보", "생성 결과"]}
    />
  );
}
