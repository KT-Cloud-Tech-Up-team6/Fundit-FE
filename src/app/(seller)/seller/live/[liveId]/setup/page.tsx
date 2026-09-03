import { redirect } from "next/navigation";

export default async function LiveSetupPage({ params }: PageProps<"/seller/live/[liveId]/setup">) {
  const { liveId } = await params;

  redirect(`/seller/live/${liveId}/cue-sheet`);
}
