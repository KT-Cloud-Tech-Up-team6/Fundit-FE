import { BuyerLiveRoom } from "@/features/buyer-live-room/ui/buyer-live-room";
import { BuyerLiveReplay } from "@/features/buyer-live-replay/ui/buyer-live-replay";
import { getLiveDemoConnection } from "@/features/buyer-live/model/live-demo";
import { roomDemo } from "@/features/buyer-live-room/model/room-demo";
import { FundingCta } from "@/features/reward-selection/ui/funding-cta";
import { LiveRewardSummary } from "@/features/reward-selection/ui/live-reward-summary";
import { BuyerLiveDesktop } from "@/features/buyer-live-room/ui/buyer-live-desktop";
import { questionDemos } from "@/features/buyer-project/model/project-demo";
import { chapterDemos } from "@/features/buyer-live-replay/model/replay-demo";
import { isPublicUuid } from "@/shared/lib/public-uuid";
import { LiveViewport } from "./live-viewport";
import { notFound } from "next/navigation";
import { RealBuyerLive } from "@/features/live-integration/ui/real-live";
import { RealLiveChatProvider } from "@/features/live-integration/ui/real-live-chat";

export default async function LivePage({ params, searchParams }: PageProps<"/live/[liveId]">) {
  const { liveId } = await params;
  const query = await searchParams;
  const connection = getLiveDemoConnection(liveId);
  if (!connection && !isPublicUuid(liveId)) notFound();
  /* 홈 실시간 LIVE 카드로 들어오면(`?from=home`) 나가기가 홈으로 돌아간다. 그 밖의 진입은 LIVE 메인이다(#526). */
  const exitHref = query.from === "home" ? "/" : "/live";
  if (!connection) {
    const replay = query.mode === "replay";
    const clip = replay && query.view === "clip";
    const clipId = typeof query.clip === "string" ? query.clip : undefined;
    /* 뷰포트 전환으로 RealBuyerLive가 두 번 마운트돼도 채팅 연결은 하나다(#470). */
    return (
      <RealLiveChatProvider liveId={liveId} replay={replay}>
        <LiveViewport
          desktop={
            <RealBuyerLive
              key={`${liveId}:desktop:${replay}:${clip}`}
              liveId={liveId}
              replay={replay}
              clip={clip}
              clipId={clipId}
              exitHref={exitHref}
              desktop
            />
          }
        >
          <RealBuyerLive
            key={`${liveId}:mobile:${replay}:${clip}`}
            liveId={liveId}
            replay={replay}
            clip={clip}
            clipId={clipId}
            exitHref={exitHref}
          />
        </LiveViewport>
      </RealLiveChatProvider>
    );
  }
  const product = connection
    ? {
        ...roomDemo,
        title: connection.data.title,
        seller: connection.data.seller,
        productImage: connection.data.image,
        avatar: connection.data.avatar ?? roomDemo.avatar,
      }
    : roomDemo;
  const replay = query.mode === "replay";
  const clip = replay && query.view === "clip";
  return (
    <LiveViewport
      desktop={
        <BuyerLiveDesktop
          key={`${liveId}:${replay}:${clip}`}
          liveId={liveId}
          replay={replay}
          clip={clip}
          product={product}
          questions={questionDemos}
          chapters={chapterDemos.map((chapter, index) => ({
            ...chapter,
            progress: [0, 50, 75, 90][index],
          }))}
          rewardSummary={<LiveRewardSummary projectId={connection?.projectId} />}
          exitHref={exitHref}
        />
      }
    >
      {replay ? (
        <BuyerLiveReplay
          key={`${liveId}:${query.view === "clip"}`}
          liveId={liveId}
          clip={query.view === "clip"}
          projectId={connection?.projectId}
          product={product}
          rewardAction={
            connection ? <FundingCta projectId={connection.projectId} more /> : undefined
          }
          exitHref={exitHref}
        />
      ) : (
        <BuyerLiveRoom
          key={liveId}
          liveId={liveId}
          projectId={connection?.projectId}
          product={product}
          rewardAction={
            connection ? <FundingCta projectId={connection.projectId} more /> : undefined
          }
          exitHref={exitHref}
        />
      )}
    </LiveViewport>
  );
}
