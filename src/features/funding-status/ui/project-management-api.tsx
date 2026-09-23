"use client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import { LoginRedirect } from "@/providers/login-redirect";
import { getManagementProject } from "@/entities/project/api/project-management-api";
import {
  ProjectWorkspaceLayout,
  projectManageTabs,
  projectEditTabs,
} from "@/entities/project/ui/project-sidebar";
import { ProjectCommunityApi } from "@/features/project-community/ui/project-community-api";
import { FundingEmptyState } from "./funding-empty-state";
import { FundingStatusApi } from "./funding-status-api";
import { QueryErrorState } from "@/shared/components/ui/query-error-state";

export function ProjectManagementApi({
  projectId,
  tab,
}: {
  projectId: string;
  tab: "funding" | "news" | "community";
}) {
  const { state } = useAuth();
  const query = useQuery({
    queryKey: ["seller-project-preview", state.user?.memberId, projectId],
    queryFn: ({ signal }) => getManagementProject(projectId, signal),
    enabled: state.status === "authenticated" && Boolean(state.user?.memberId),
  });
  if (state.status === "checking") return <p role="status">로그인 상태를 확인하고 있습니다.</p>;
  if (state.status === "guest") return <LoginRedirect />;
  if (!state.user?.memberId)
    return <p role="alert">회원 정보를 확인하지 못했습니다. 새로고침 후 다시 시도해 주세요.</p>;
  if (query.isPending) return <p role="status">프로젝트를 불러오고 있습니다.</p>;
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
      activeTab={tab}
      projectId={projectId}
      projectName={query.data.title ?? "제목 없음"}
      tabs={tab === "news" ? projectEditTabs : projectManageTabs}
    >
      <div className="flex min-w-0 flex-1 flex-col">
        {tab === "funding" && query.data.status === "DRAFT" ? (
          <FundingEmptyState />
        ) : tab === "funding" ? (
          <FundingStatusApi project={query.data} />
        ) : (
          <ProjectCommunityApi key={`${projectId}-${tab}`} projectId={projectId} tab={tab} />
        )}
      </div>
    </ProjectWorkspaceLayout>
  );
}
