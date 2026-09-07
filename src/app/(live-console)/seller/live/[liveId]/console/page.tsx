import { LiveConsole } from "@/features/live-console/ui/live-console";

export default async function LiveConsolePage({
  params,
}: PageProps<"/seller/live/[liveId]/console">) {
  const { liveId } = await params;
  return <LiveConsole key={liveId} liveId={liveId} />;
}
