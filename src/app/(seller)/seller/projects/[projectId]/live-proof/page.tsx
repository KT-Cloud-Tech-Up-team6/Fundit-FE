import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default async function LiveProofPage({
  params,
}: PageProps<"/seller/projects/[projectId]/live-proof">) {
  const { projectId } = await params;
  return (
    <PagePlaceholder
      eyebrow="Seller · LIVE Proof"
      title={`LIVE 검증 편집 · ${projectId}`}
      description="방송 종료 후 AI 요약·답변·시연 클립을 판매자가 검수하고 공개합니다."
      screenIds="S-11"
      access="owner seller"
      sections={["AI 요약", "답변·클립 편집", "공개 제어"]}
    />
  );
}
