import { LiveConsole } from "@/features/live-console/ui/live-console";
import { RealSellerLive } from "@/features/live-integration/ui/real-live";
import { notFound } from "next/navigation";

export default async function LiveConsolePage({
  params,
}: PageProps<"/seller/live/[liveId]/console">) {
  const { liveId } = await params;
  if (
    !liveId.startsWith("demo") &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(liveId)
  )
    notFound();
  if (!liveId.startsWith("demo")) return <RealSellerLive key={liveId} liveId={liveId} />;
  return <LiveConsole key={liveId} liveId={liveId} />;
}
