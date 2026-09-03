import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default async function LiveCueSheetPage({
  params,
}: PageProps<"/seller/live/[liveId]/cue-sheet">) {
  const { liveId } = await params;

  return (
    <PagePlaceholder
      eyebrow="Seller · LIVE"
      title={`AI 큐시트 · ${liveId}`}
      description="AI 큐시트를 생성하고 방송 타임라인과 진행 문구를 편집합니다."
      screenIds="FL_S_LV_AIC"
      access="live owner"
      sections={["큐시트 생성", "타임라인 편집", "임시저장"]}
    />
  );
}
