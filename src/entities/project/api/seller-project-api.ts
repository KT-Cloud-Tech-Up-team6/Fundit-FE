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
  title: string | null;
  status: ProjectApiStatus;
  goalAmount: number | null;
  coverImageUrl: string | null;
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
