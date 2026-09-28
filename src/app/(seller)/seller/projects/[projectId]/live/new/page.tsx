import { LiveCreateApi } from "@/features/live-create/ui/live-create-api";

export default async function NewLivePage({
  params,
  searchParams,
}: PageProps<"/seller/projects/[projectId]/live/new">) {
  const { projectId } = await params;
  /* LIVE 스튜디오의 시작 실패 카드가 `?liveId=`로 그 LIVE를 불러와 다시 시작한다(#400). */
  const { liveId } = await searchParams;
  const resumeLiveId = typeof liveId === "string" && liveId ? liveId : undefined;

  return (
    <LiveCreateApi
      key={`${projectId}:${resumeLiveId ?? ""}`}
      projectId={projectId}
      resumeLiveId={resumeLiveId}
    />
  );
}
