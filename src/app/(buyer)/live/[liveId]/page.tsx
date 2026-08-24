import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default async function LivePage({ params, searchParams }: PageProps<"/live/[liveId]">) {
  const { liveId } = await params;
  const query = await searchParams;
  const mode = query.mode === "replay" ? "replay" : "live";

  return (
    <PagePlaceholder
      eyebrow={`Buyer · LIVE · ${mode}`}
      title={`LIVE ${liveId}`}
      description="스트리밍·프로젝트 배너·채팅을 독립된 장애 경계로 구성하는 화면입니다."
      screenIds="B-06~B-08"
      access="read public / write member"
      sections={[
        mode === "replay" ? "VOD 플레이어" : "HLS 플레이어",
        "연결된 프로젝트",
        "채팅·Q&A",
      ]}
    />
  );
}
