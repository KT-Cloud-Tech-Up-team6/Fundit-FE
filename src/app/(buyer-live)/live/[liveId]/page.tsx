import { BuyerLiveRoom } from "@/features/buyer-live-room/ui/buyer-live-room";
import { BuyerShell } from "@/shared/components/layout/buyer-shell";
import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default async function LivePage({ params, searchParams }: PageProps<"/live/[liveId]">) {
  const { liveId } = await params;
  const query = await searchParams;
  if (query.mode === "replay") {
    return (
      <BuyerShell>
        <PagePlaceholder
          eyebrow="Buyer · LIVE · replay"
          title={`LIVE ${liveId}`}
          description="스트리밍·프로젝트 배너·채팅을 독립된 장애 경계로 구성하는 화면입니다."
          screenIds="B-06~B-08"
          access="read public / write member"
          sections={["VOD 플레이어", "연결된 프로젝트", "채팅·Q&A"]}
        />
      </BuyerShell>
    );
  }
  return <BuyerLiveRoom key={liveId} liveId={liveId} />;
}
