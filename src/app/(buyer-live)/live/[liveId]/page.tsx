import { BuyerLiveRoom } from "@/features/buyer-live-room/ui/buyer-live-room";
import { BuyerLiveReplay } from "@/features/buyer-live-replay/ui/buyer-live-replay";

export default async function LivePage({ params, searchParams }: PageProps<"/live/[liveId]">) {
  const { liveId } = await params;
  const query = await searchParams;
  if (query.mode === "replay") {
    return (
      <BuyerLiveReplay
        key={`${liveId}:${query.view === "clip"}`}
        liveId={liveId}
        clip={query.view === "clip"}
      />
    );
  }
  return <BuyerLiveRoom key={liveId} liveId={liveId} />;
}
