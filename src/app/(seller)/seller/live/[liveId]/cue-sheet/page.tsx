import { LiveCueSheetFlow } from "@/features/live-cue-sheet/ui/live-cue-sheet-flow";

export default async function LiveCueSheetPage({
  params,
}: PageProps<"/seller/live/[liveId]/cue-sheet">) {
  const { liveId } = await params;

  return <LiveCueSheetFlow key={liveId} liveId={liveId} />;
}
