import { BuyerLiveRoom } from "@/features/buyer-live-room/ui/buyer-live-room";
import { BuyerLiveReplay } from "@/features/buyer-live-replay/ui/buyer-live-replay";
import { getLiveDemoConnection } from "@/features/buyer-live/model/live-demo";
import { roomDemo } from "@/features/buyer-live-room/model/room-demo";
import { FundingCta } from "@/features/reward-selection/ui/funding-cta";

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
  if (query.mode === "replay") {
    return (
      <BuyerLiveReplay
        key={`${liveId}:${query.view === "clip"}`}
        liveId={liveId}
        clip={query.view === "clip"}
        projectId={connection?.projectId}
        product={product}
      />
    );
  }
  return (
    <BuyerLiveRoom
      key={liveId}
      liveId={liveId}
      projectId={connection?.projectId}
      product={product}
      rewardAction={connection ? <FundingCta projectId={connection.projectId} more /> : undefined}
    />
  );
}
