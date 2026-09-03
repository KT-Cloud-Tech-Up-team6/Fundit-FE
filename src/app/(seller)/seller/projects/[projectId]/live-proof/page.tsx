import { redirect } from "next/navigation";

export default async function LiveProofPage({
  params,
}: PageProps<"/seller/projects/[projectId]/live-proof">) {
  const { projectId } = await params;

  redirect(`/seller/projects/${projectId}?tab=live`);
}
