"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import { LoginRedirect } from "@/providers/login-redirect";
import { QueryErrorState } from "@/shared/components/ui/query-error-state";
import { uploadProjectMedia } from "@/entities/project/api/media-api";
import {
  agreeProjectPrivacy,
  getProjectPreview,
  saveProjectBasicInfo,
  type BasicInfoResponse,
} from "@/entities/project/api/seller-project-api";
import { basicInfoRequest, businessCodes, type BasicInfoValues } from "../model/basic-info-request";
import { ProjectBasicInfoForm } from "./project-basic-info-form";
import { ProjectSavedModal } from "./project-saved-modal";
import { createProjectOnce, projectAttemptKey } from "../model/project-create-attempt";
import { createRewardOnce, registerRewards } from "../model/reward-create-attempt";
import { rewardRequest } from "../model/reward-request";
import type { DemoReward } from "../model/basic-info-demo";
import { ProjectWorkspaceLayout, projectEditTabs } from "@/entities/project/ui/project-sidebar";
import { useProjectManageTabs } from "@/features/seller-live-clips/model/use-project-manage-tabs";

/** 프로젝트 기본 정보 탭의 데이터를 조회하고 편집 화면에 전달한다. */
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
  /* 운영 사이드바를 쓰는 탭에서만 종료된 LIVE를 확인한다. 기본 정보 탭은 데모 id로도 열린다. */
  const manageTabs = useProjectManageTabs(
    tab === "basic-info" || tab === "refund-policy" ? undefined : projectId,
  );
  const preview = useQuery({
    queryKey: ["seller-project-preview", owner, projectId],
    queryFn: ({ signal }) => getProjectPreview(projectId!, signal),
    enabled: enabled && Boolean(projectId),
  });
  const saved = cache.getQueryData<BasicInfoResponse>(["seller-project-basic", owner, projectId]);
  /* 신규 생성 첫(임시저장 아닌) 저장 직후에만 완료 모달을 띄운다. 값이 있는 동안은
     방금 만든 프로젝트 id를 들고 있다가 모달 버튼이 눌릴 때 이동한다. */
  const [createdId, setCreatedId] = useState<string | null>(null);
  /* 신규 생성 화면은 ProjectCreateFlow의 동의 모달에서 필수 항목(개인정보 수집·이용 포함)에
     동의해야 쓸 수 있다. 그 동의를 공개 조건인 BE 개인정보 동의로 프로젝트마다 한 번 기록한다. */
  const consentedId = useRef<string | null>(null);
  /* 생성을 마친 시도의 저장 이름. 모달 버튼 대신 뒤로 가기 등으로 화면을 떠나도 지워야 같은 탭의
     다음 생성 화면이 이미 만든 프로젝트 id를 받아 그 기본정보를 덮어쓰지 않는다. 새로고침에서는
     이 정리가 돌지 않아 아래 저장처럼 같은 프로젝트로 이어진다. */
  const completedAttempt = useRef<string | null>(null);
  useEffect(
    () => () => {
      if (completedAttempt.current) sessionStorage.removeItem(completedAttempt.current);
    },
    [],
  );
  /* 올린 이미지 URL을 파일별로 남긴다. 저장에 실패한 뒤 다시 저장해도 같은 URL을 써야 리워드 본문이
     같아, 결과를 모르던 생성의 같은 멱등 키가 409로 거절되지 않는다. */
  const uploaded = useRef(new Map<File, string>());
  async function save(
    values: BasicInfoValues,
    partial = false,
    rewards: DemoReward[] = [],
    onRewardRegistered: (id: number) => void = () => {},
  ) {
    if (!enabled || !owner) throw new Error("로그인이 필요합니다.");
    const id = projectId ?? (await createProjectOnce(sessionStorage, owner));
    if (!projectId && consentedId.current !== id) {
      await agreeProjectPrivacy(id);
      consentedId.current = id;
    }
    const request = basicInfoRequest(values);
    /* 리워드만 있는 임시저장은 보낼 기본 정보가 없다. */
    if (Object.keys(request).length) {
      const response = await saveProjectBasicInfo(id, request);
      cache.setQueryData(["seller-project-basic", owner, id], response);
    }
    /* 새 프로젝트 화면에서 모은 리워드는 프로젝트가 생긴 뒤에야 등록할 수 있다(이미지 업로드도 마찬가지). */
    if (!projectId)
      await registerRewards(
        rewards,
        async (reward) => {
          let imageUrl: string | undefined;
          if (reward.file) {
            imageUrl = uploaded.current.get(reward.file);
            if (!imageUrl) {
              imageUrl = await uploadProjectMedia(id, reward.file, "image");
              uploaded.current.set(reward.file, imageUrl);
            }
          }
          await createRewardOnce(sessionStorage, owner, id, rewardRequest(reward, imageUrl, true));
        },
        onRewardRegistered,
      );
    await Promise.all([
      cache.invalidateQueries({ queryKey: ["seller-rewards", owner, id] }),
      cache.invalidateQueries({ queryKey: ["seller-projects"] }),
      cache.invalidateQueries({ queryKey: ["seller-project-counts"] }),
      cache.invalidateQueries({ queryKey: ["seller-project-preview", owner, id] }),
    ]);
    if (!projectId) {
      /* 완료 모달을 거치는 저장은 모달 버튼을 눌러 실제로 떠날 때까지 시도 키를 지우지 않는다.
         새로고침 시에도 같은 프로젝트로 복귀시키는 createProjectOnce의 중복 생성 방지가
         모달이 떠 있는 동안에도 계속 걸려 있어야 한다. */
      if (partial) {
        sessionStorage.removeItem(projectAttemptKey(owner));
        router.replace(`/seller/projects/${id}?tab=basic-info`);
      } else {
        completedAttempt.current = projectAttemptKey(owner);
        setCreatedId(id);
      }
    }
  }
  function leaveAfterCreate(destination: "basic-info" | "story") {
    if (!owner || !createdId) return;
    sessionStorage.removeItem(projectAttemptKey(owner));
    router.replace(`/seller/projects/${createdId}?tab=${destination}`);
  }
  if (state.status === "checking") return <p role="status">로그인 상태를 확인하고 있습니다.</p>;
  if (state.status === "guest") return <LoginRedirect />;
  if (!owner)
    return <p role="alert">회원 정보를 확인하지 못했습니다. 새로고침 후 다시 시도해 주세요.</p>;
  if (projectId && preview.isPending) return <p role="status">프로젝트를 불러오고 있습니다.</p>;
  if (projectId && preview.isError)
    return (
      <QueryErrorState
        error={preview.error}
        onRetry={() => void preview.refetch()}
        notFoundHref="/seller/projects"
      />
    );
  if (!projectId)
    return (
      <>
        <ProjectBasicInfoForm key={owner} onSave={save} />
        {createdId && (
          <ProjectSavedModal
            onLater={() => leaveAfterCreate("basic-info")}
            onWriteStory={() => leaveAfterCreate("story")}
          />
        )}
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
        tab === "community"
          ? manageTabs
          : tab === "basic-info" || tab === "refund-policy" || data.status === "DRAFT"
            ? projectEditTabs
            : manageTabs
      }
    >
      <div className="w-full min-w-0 flex-1 lg:max-w-[792px]">
        {tab === "basic-info" ? (
          <ProjectBasicInfoForm
            key={`${owner}:${projectId}`}
            initialValues={initialValues}
            mode="edit"
            onSave={save}
            statusMessage={
              initialValues.business
                ? undefined
                : "저장된 사업자 유형을 확인할 수 없습니다. 아래에서 다시 선택해주세요."
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
