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

/* LIVE를 열 수 있는 진행 중 프로젝트(#418). 목록 API에 카테고리 필터가 없어 한 번에 받아 화면에서
   추린다. 100은 BE `ProjectController.MAX_PAGE_SIZE`이고, 그보다 많으면 첫 페이지까지만 보인다. */
export const getOngoingProjects = (signal?: AbortSignal) =>
  apiRequest<ProjectPage>("/api/v1/projects?status=ONGOING&page=0&size=100", {
    auth: true,
    signal,
  });

/* 펀딩 관리 헤더의 대분류·기간(#559). 미리보기·상세 응답에는 펀딩 시작일이 없어 펀딩 관리를 여는 진행 중·완료
   프로젝트 목록에서 찾는다. 100은 BE `ProjectController.MAX_PAGE_SIZE`이고, 그보다 많으면 첫 페이지까지만 찾는다. */
export const getFundingProjects = (signal?: AbortSignal) =>
  apiRequest<ProjectPage>("/api/v1/projects?status=ONGOING,SUCCEEDED,FAILED&page=0&size=100", {
    auth: true,
    signal,
  });

export function getProjectCounts(signal?: AbortSignal) {
  return apiRequest<{ ongoing: number; draft: number; completed: number }>(
    "/api/v1/projects/status-counts",
    { auth: true, signal },
  );
}

/* 같은 판매자가 같은 키로 다시 보내면 BE는 새로 만들지 않고 기존 프로젝트를 200으로 돌려준다
   (BE #145). 키는 100자 이하, 유효기간 없이 프로젝트에 저장된다. */
export function createProject(idempotencyKey: string) {
  return apiRequest<{ projectId: string; status: "DRAFT" }>("/api/v1/projects", {
    auth: true,
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
  });
}

/** 준비 중(DRAFT) 프로젝트만 삭제할 수 있다. 그 외 상태는 BE가 422
 * `PROJECT_NOT_DELETABLE`로 거절한다. */
export function deleteProject(projectId: string) {
  return apiRequest<void>(`/api/v1/projects/${encodeURIComponent(projectId)}`, {
    auth: true,
    method: "DELETE",
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
 * `answer`는 보낸 답변이다. 이미 올린 질문은 409 `LIVE_VERIFICATION_ALREADY_EXISTS`다.
 * BE가 방송 종료 뒤 질문 요약을 비동기로 받아 두기 전이거나 요약에 들지 못한 질문은
 * 404 `LIVE_QUESTION_SUMMARY_NOT_FOUND`다.
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

/**
 * 판매자용 LIVE 질문 목록. BE가 받아 둔 질문 요약 전체(미답변 포함)이고 프로젝트 단위라 `liveId`가 없다.
 * `answered`는 LIVE 체크에 등록했는지다.
 */
export function getLiveQuestions(projectId: string, signal?: AbortSignal) {
  return apiRequest<{
    content: {
      questionSummaryId: string;
      questionText: string;
      questionCount: number;
      answered: boolean;
      liveVerificationId: number | null;
      answer: string | null;
    }[];
  }>(`/api/v1/projects/${encodeURIComponent(projectId)}/live-questions`, { auth: true, signal });
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
