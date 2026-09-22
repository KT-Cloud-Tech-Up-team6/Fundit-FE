import { LiveCueSheetApi } from "@/features/live-cue-sheet/ui/live-cue-sheet-api";

export default async function LiveCueSheetPage({
  params,
}: PageProps<"/seller/live/[liveId]/cue-sheet">) {
  const { liveId } = await params;

  return <LiveCueSheetApi key={liveId} liveId={liveId} />;
}
