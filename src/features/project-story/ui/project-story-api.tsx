"use client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import { LoginRedirect } from "@/providers/login-redirect";
import { getStoryPreview } from "@/entities/project/api/story-api";
import { ProjectWorkspaceLayout, projectEditTabs } from "@/entities/project/ui/project-sidebar";
import { ProjectStoryForm } from "./project-story-form";
import { QueryErrorState } from "@/shared/components/ui/query-error-state";

/** 프로젝트 스토리 편집에 필요한 프로젝트 정보를 조회한다. */
export function ProjectStoryApi({ projectId }: { projectId: string }) {
  const { state } = useAuth();
  const query = useQuery({
    queryKey: ["seller-project-preview", state.user?.memberId, projectId],
    queryFn: ({ signal }) => getStoryPreview(projectId, signal),
    enabled: state.status === "authenticated" && Boolean(state.user?.memberId),
  });
  if (state.status === "checking") return <p role="status">로그인 상태를 확인하고 있습니다.</p>;
  if (state.status === "guest") return <LoginRedirect />;
  if (!state.user?.memberId)
    return <p role="alert">회원 정보를 확인하지 못했습니다. 새로고침 후 다시 시도해 주세요.</p>;
  if (query.isPending) return <p role="status">스토리를 불러오고 있습니다.</p>;
  if (query.isError)
    return (
      <QueryErrorState
        error={query.error}
        onRetry={() => void query.refetch()}
        notFoundHref="/seller/projects"
      />
    );
  return (
    <ProjectWorkspaceLayout
      activeTab="story"
      projectId={projectId}
      projectName={query.data.title ?? "제목 없음"}
      tabs={projectEditTabs}
    >
      <ProjectStoryForm key={projectId} projectId={projectId} initial={query.data} />
    </ProjectWorkspaceLayout>
  );
}
