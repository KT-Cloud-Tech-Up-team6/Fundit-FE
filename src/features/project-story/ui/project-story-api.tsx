"use client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import { LoginRedirect } from "@/providers/login-redirect";
import { getStoryPreview } from "@/entities/project/api/story-api";
import { ProjectSidebar, projectEditTabs } from "@/entities/project/ui/project-sidebar";
import { ProjectStoryForm } from "./project-story-form";

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
      <p role="alert">
        스토리를 불러오지 못했습니다.{" "}
        <button onClick={() => void query.refetch()}>다시 시도</button>
      </p>
    );
  return (
    <div className="mt-3 flex flex-col items-start gap-6 lg:flex-row">
      <ProjectSidebar
        activeTab="story"
        projectId={projectId}
        projectName={query.data.title ?? "제목 없음"}
        tabs={projectEditTabs}
      />
      <ProjectStoryForm key={projectId} projectId={projectId} initial={query.data} />
    </div>
  );
}
