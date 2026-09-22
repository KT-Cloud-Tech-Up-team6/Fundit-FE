import { LiveCreateApi } from "@/features/live-create/ui/live-create-api";

export default async function NewLivePage({
  params,
}: PageProps<"/seller/projects/[projectId]/live/new">) {
  const { projectId } = await params;

  return <LiveCreateApi key={projectId} projectId={projectId} />;
}
