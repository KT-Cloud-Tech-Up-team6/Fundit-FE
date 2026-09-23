import { apiRequest } from "@/shared/api/client";
import type { SellerProjectStatus } from "../model/seller-project";

export type ProjectApiStatus = "DRAFT" | "ONGOING" | "SUCCEEDED" | "FAILED";
export type BusinessType = "GENERAL" | "SOLE" | "CORP";
export type BasicInfoRequest = {
  businessType?: BusinessType;
  categoryMajor?: string;
  categoryMinor?: string;
  title?: string;
  goalAmount?: number;
};
export type BasicInfoResponse = BasicInfoRequest & { projectId: string; updatedAt: string };
export type ProjectListItem = {
  projectId: string;
  title: string | null;
  thumbnailUrl: string | null;
  status: ProjectApiStatus;
  createdAt: string;
  fundingStartAt: string | null;
  fundingDeadline: string | null;
  goalAmount: number | null;
  categoryMajor: string | null;
  categoryMinor: string | null;
  currentAmount: number;
  participantCount: number;
  achievementRate: number;
};
export type ProjectPage = {
  content: ProjectListItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
};
export type ProjectPreview = {
  projectId: string;
  categoryMajor?: string | null;
  categoryMinor?: string | null;
  title: string | null;
  status: ProjectApiStatus;
  goalAmount: number | null;
  coverImageUrl: string | null;
  businessType?: BusinessType | null;
};

const statusFilter: Record<SellerProjectStatus, string> = {
  active: "ONGOING",
  draft: "DRAFT",
  closed: "SUCCEEDED,FAILED",
};

export function getSellerProjects(
  status: SellerProjectStatus,
  search: string,
  page: number,
  signal?: AbortSignal,
) {
  const query = new URLSearchParams({
    status: statusFilter[status],
    page: String(page - 1),
    size: "8",
  });
  if (search.trim()) query.set("q", search.trim());
  return apiRequest<ProjectPage>(`/api/v1/projects?${query}`, { auth: true, signal });
}

export function getProjectCounts(signal?: AbortSignal) {
  return apiRequest<{ ongoing: number; draft: number; completed: number }>(
    "/api/v1/projects/status-counts",
    { auth: true, signal },
  );
}

export function createProject() {
  return apiRequest<{ projectId: string; status: "DRAFT" }>("/api/v1/projects", {
    auth: true,
    method: "POST",
  });
}

export function saveProjectBasicInfo(projectId: string, body: BasicInfoRequest) {
  return apiRequest<BasicInfoResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/basic-info`,
    {
      auth: true,
      method: "PATCH",
      body,
    },
  );
}

export function getProjectPreview(projectId: string, signal?: AbortSignal) {
  return apiRequest<ProjectPreview>(`/api/v1/projects/${encodeURIComponent(projectId)}/preview`, {
    auth: true,
    signal,
  });
}

/**
 * LIVE 체크(검증) 등록. 한 번에 한 건이다. `questionSummaryId`는 LIVE 질문 요약의 id,
 * `answer`는 보낸 답변이다. 같은 질문을 다시 올려도 BE가 막지 않으므로 화면이 막는다.
 */
export function createLiveVerification(
  projectId: string,
  body: { questionSummaryId: string; answer: string },
) {
  return apiRequest<{ liveVerificationId: number; answer: string; createdAt: string }>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/live-verifications`,
    { auth: true, method: "POST", body },
  );
}

/** 개인정보 수집 동의 기록. 공개(`submitProject`)의 선행 조건이다. `agreed: false`는 422라 보내지 않는다. */
export function agreeProjectPrivacy(projectId: string) {
  return apiRequest<{ projectId: string; consentedAt: string }>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/privacy-consent`,
    { auth: true, method: "POST", body: { agreed: true } },
  );
}

/**
 * 프로젝트 공개. 관리자 승인 없이 준비중(DRAFT)이 바로 진행중(ONGOING)이 되고 펀딩 기간 30일이
 * 시작된다. 필수 항목이 빠지면 422 `PROJECT_NOT_SUBMITTABLE`이다(`project-publish.ts`).
 */
export function submitProject(projectId: string) {
  return apiRequest<{ projectId: string; status: ProjectApiStatus }>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/submit`,
    { auth: true, method: "POST" },
  );
}
