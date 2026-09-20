"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import { getManagementProject } from "@/entities/project/api/project-management-api";
import {
  ProjectSidebar,
  projectManageTabs,
  projectEditTabs,
} from "@/entities/project/ui/project-sidebar";
import { ProjectCommunityApi } from "@/features/project-community/ui/project-community-api";
import { FundingStatusApi } from "./funding-status-api";

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
  if (state.status !== "authenticated" || !state.user?.memberId)
    return (
      <p role="alert">
        로그인이 필요합니다. <Link href="/auth/login">로그인</Link>
      </p>
    );
  if (query.isPending) return <p role="status">프로젝트를 불러오고 있습니다.</p>;
  if (query.isError)
    return (
      <p role="alert">
        프로젝트를 불러오지 못했습니다.{" "}
        <button onClick={() => void query.refetch()}>다시 시도</button>
      </p>
    );
  return (
    <div className="mt-3 flex flex-col items-start gap-6 lg:flex-row">
      <ProjectSidebar
        activeTab={tab}
        projectId={projectId}
        projectName={query.data.title ?? "제목 없음"}
        tabs={query.data.status === "DRAFT" ? projectEditTabs : projectManageTabs}
      />
      <div className="min-w-0 flex-1">
        {tab === "funding" ? (
          <FundingStatusApi project={query.data} />
        ) : (
          <ProjectCommunityApi key={`${projectId}-${tab}`} projectId={projectId} tab={tab} />
        )}
      </div>
    </div>
  );
}
