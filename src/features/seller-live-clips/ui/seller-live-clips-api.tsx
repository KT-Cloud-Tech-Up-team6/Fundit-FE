"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { getManagementProject } from "@/entities/project/api/project-management-api";
import { ProjectWorkspaceLayout } from "@/entities/project/ui/project-sidebar";
import { setHighlightVisibility } from "@/features/live-integration/api/live-api";
import { useAuth } from "@/providers/auth-provider";
import { LoginRedirect } from "@/providers/login-redirect";
import { QueryErrorState } from "@/shared/components/ui/query-error-state";
import { getProjectClips } from "../api/project-clips-api";
import { applySaved, splitSaveResults, type LiveClip } from "../model/live-clips";
import { useProjectManageTabs } from "../model/use-project-manage-tabs";
import { LiveClipIntro, LiveClipManager } from "./live-clip-manager";

/** 판매자 프로젝트의 LIVE 클립 관리 탭(`?tab=live`). 프로젝트 권한을 먼저 확인한다. */
export function SellerLiveClipsApi({ projectId }: { projectId: string }) {
  const { state } = useAuth();
  const cache = useQueryClient();
  const search = useSearchParams();
  const owner = state.user?.memberId;
  const tabs = useProjectManageTabs(projectId);
  const project = useQuery({
    queryKey: ["seller-project-preview", owner, projectId],
    queryFn: ({ signal }) => getManagementProject(projectId, signal),
    enabled: state.status === "authenticated" && Boolean(owner),
  });
  const clipsKey = ["seller-live-clips", owner, projectId];
  const clips = useQuery({
    queryKey: clipsKey,
    queryFn: ({ signal }) => getProjectClips(projectId, signal),
    enabled: project.isSuccess,
  });

  function pageHref(page: number) {
    const params = new URLSearchParams(search.toString());
    params.set("tab", "live");
    params.set("page", String(page));
    return `/seller/projects/${projectId}?${params}`;
  }

  /* 바뀐 클립마다 따로 보내 일부가 실패해도 나머지는 반영한다. 성공분은 곧바로 화면 목록에
     반영하고, 서버 값으로 다시 맞추도록 목록을 새로 받는다. */
  async function save(changes: LiveClip[]) {
    const results = await Promise.allSettled(
      changes.map((clip) => setHighlightVisibility(clip.liveId, clip.highlightId, !clip.isPublic)),
    );
    const { saved, failed } = splitSaveResults(changes, results);
    cache.setQueryData<LiveClip[]>(clipsKey, (current) => current && applySaved(current, saved));
    void cache.invalidateQueries({ queryKey: clipsKey });
    return failed;
  }

  if (state.status === "checking") return <p role="status">로그인 상태를 확인하고 있습니다.</p>;
  if (state.status === "guest") return <LoginRedirect />;
  if (!owner)
    return <p role="alert">회원 정보를 확인하지 못했습니다. 새로고침 후 다시 시도해 주세요.</p>;
  if (project.isPending) return <p role="status">프로젝트를 불러오고 있습니다.</p>;
  if (project.isError)
    return (
      <QueryErrorState
        error={project.error}
        onRetry={() => void project.refetch()}
        notFoundHref="/seller/projects"
      />
    );
  const projectTitle = project.data.title || "제목 없음";
  return (
    <ProjectWorkspaceLayout
      activeTab="live"
      projectId={projectId}
      projectName={projectTitle}
      tabs={tabs}
    >
      <div className="max-w-[792px] min-w-0 flex-1">
        <LiveClipIntro />
        {/* 저장 뒤 다시 받기가 실패해도 이미 받은 목록은 그대로 둔다. */}
        {clips.data ? (
          <LiveClipManager
            projectTitle={projectTitle}
            clips={clips.data}
            requestedPage={Number(search.get("page") ?? 1)}
            buildPageHref={pageHref}
            onSave={save}
          />
        ) : clips.isError ? (
          <QueryErrorState
            variant="section"
            error={clips.error}
            description="숏 클립을 불러오지 못했습니다."
            className="mt-8"
            onRetry={() => void clips.refetch()}
            notFoundHref="/seller/projects"
          />
        ) : (
          <p role="status" className="text-body-s text-text-secondary mt-8">
            숏 클립을 불러오고 있습니다.
          </p>
        )}
      </div>
    </ProjectWorkspaceLayout>
  );
}
