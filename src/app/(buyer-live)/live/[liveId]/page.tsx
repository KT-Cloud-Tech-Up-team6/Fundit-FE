import { BuyerLiveRoom } from "@/features/buyer-live-room/ui/buyer-live-room";
import { BuyerLiveReplay } from "@/features/buyer-live-replay/ui/buyer-live-replay";
import { getLiveDemoConnection } from "@/features/buyer-live/model/live-demo";
import { roomDemo } from "@/features/buyer-live-room/model/room-demo";
import { FundingCta } from "@/features/reward-selection/ui/funding-cta";
import { LiveRewardSummary } from "@/features/reward-selection/ui/live-reward-summary";
import { BuyerLiveDesktop } from "@/features/buyer-live-room/ui/buyer-live-desktop";
import { questionDemos } from "@/features/buyer-project/model/project-demo";
import { chapterDemos } from "@/features/buyer-live-replay/model/replay-demo";
import { LiveViewport } from "./live-viewport";

export default async function LivePage({ params, searchParams }: PageProps<"/live/[liveId]">) {
  const { liveId } = await params;
  const query = await searchParams;
  const connection = getLiveDemoConnection(liveId);
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
        />
      )}
    </LiveViewport>
  );
}
