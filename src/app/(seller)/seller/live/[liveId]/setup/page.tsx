import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default async function LiveSetupPage({ params }: PageProps<"/seller/live/[liveId]/setup">) {
  const { liveId } = await params;
  return (
    <PagePlaceholder
      eyebrow="Seller · LIVE"
      title={`방송 설정 · ${liveId}`}
      description="방송 일정과 메타데이터를 설정하고 AI 큐시트를 생성·편집합니다."
      screenIds="S-09"
      access="live owner"
      sections={["일정·메타데이터", "AI 큐시트 생성", "큐시트 편집"]}
    />
  );
}
