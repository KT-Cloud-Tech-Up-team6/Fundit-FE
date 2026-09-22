"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import { LoginRedirect } from "@/providers/login-redirect";
import {
  getProjectPreview,
  saveProjectBasicInfo,
  type BasicInfoResponse,
} from "@/entities/project/api/seller-project-api";
import { basicInfoRequest, businessCodes, type BasicInfoValues } from "../model/basic-info-request";
import { ProjectBasicInfoForm } from "./project-basic-info-form";
import { createProjectOnce, projectAttemptKey } from "../model/project-create-attempt";
import {
  ProjectWorkspaceLayout,
  projectEditTabs,
  projectManageTabs,
} from "@/entities/project/ui/project-sidebar";

export function ProjectBasicInfoApi({
  projectId,
  tab = "basic-info",
}: {
  projectId?: string;
  tab?: string;
}) {
  const { state } = useAuth();
  const router = useRouter();
  const cache = useQueryClient();
  const owner = state.user?.memberId;
  const enabled = state.status === "authenticated" && Boolean(owner);
  const preview = useQuery({
    queryKey: ["seller-project-preview", owner, projectId],
    queryFn: ({ signal }) => getProjectPreview(projectId!, signal),
    enabled: enabled && Boolean(projectId),
  });
  const saved = cache.getQueryData<BasicInfoResponse>(["seller-project-basic", owner, projectId]);
  async function save(values: BasicInfoValues) {
    if (!enabled || !owner) throw new Error("로그인이 필요합니다.");
    const id = projectId ?? (await createProjectOnce(sessionStorage, owner));
    const response = await saveProjectBasicInfo(id, basicInfoRequest(values));
    cache.setQueryData(["seller-project-basic", owner, id], response);
    await Promise.all([
      cache.invalidateQueries({ queryKey: ["seller-projects"] }),
      cache.invalidateQueries({ queryKey: ["seller-project-counts"] }),
      cache.invalidateQueries({ queryKey: ["seller-project-preview", owner, id] }),
    ]);
    if (!projectId) {
      sessionStorage.removeItem(projectAttemptKey(owner));
      router.replace(`/seller/projects/${id}?tab=basic-info`);
    }
  }
  if (state.status === "checking") return <p role="status">로그인 상태를 확인하고 있습니다.</p>;
  if (state.status === "guest") return <LoginRedirect />;
  if (!owner)
    return <p role="alert">회원 정보를 확인하지 못했습니다. 새로고침 후 다시 시도해 주세요.</p>;
  if (projectId && preview.isPending) return <p role="status">프로젝트를 불러오고 있습니다.</p>;
  if (projectId && preview.isError)
    return (
      <div role="alert">
        <p>프로젝트를 불러올 수 없습니다. 접근 권한과 프로젝트 주소를 확인해주세요.</p>
        <button type="button" className="underline" onClick={() => void preview.refetch()}>
          다시 시도
        </button>
      </div>
    );
  if (!projectId)
    return (
      <>
        <ProjectBasicInfoForm key={owner} onSave={save} />
        <Link href="/seller/projects?status=draft" className="block py-4 underline">
          내 프로젝트 목록에서 생성 여부 확인
        </Link>
      </>
    );
  const data = preview.data!;
  const initialValues = {
    title: saved?.title ?? data.title ?? "",
    amount: String(saved?.goalAmount ?? data.goalAmount ?? ""),
    business:
      Object.keys(businessCodes).find(
        (label) => businessCodes[label] === (saved?.businessType ?? data.businessType),
      ) ?? "",
    category: saved?.categoryMajor ?? data.categoryMajor ?? "",
    subcategory: saved?.categoryMinor ?? data.categoryMinor ?? "",
  };
  return (
    <ProjectWorkspaceLayout
      activeTab={tab}
      projectId={projectId}
      projectName={data.title || "제목 없음"}
      tabs={
        tab === "community" || tab === "settlement"
          ? projectManageTabs
          : tab === "basic-info" || tab === "refund-policy" || data.status === "DRAFT"
            ? projectEditTabs
            : projectManageTabs
      }
    >
      <div className="w-full min-w-0 flex-1 lg:max-w-[792px]">
        {tab === "basic-info" ? (
          <ProjectBasicInfoForm
            key={`${owner}:${projectId}`}
            initialValues={initialValues}
            mode="edit"
            onSave={save}
            rewardProjectId={projectId}
            statusMessage={
              initialValues.business
                ? undefined
                : "저장된 사업자 유형을 확인할 수 없습니다. 변경할 때만 선택하면 기존 값은 유지됩니다."
            }
          />
        ) : (
          <>
            <h1 className="text-heading-l">{data.title || "제목 없음"}</h1>
            <p className="text-body-s mt-4">해당 관리 화면은 연결 준비 중입니다.</p>
            <Link
              className="mt-4 block underline"
              href={`/seller/projects/${projectId}?tab=basic-info`}
            >
              기본 정보 수정
            </Link>
          </>
        )}
      </div>
    </ProjectWorkspaceLayout>
  );
}
