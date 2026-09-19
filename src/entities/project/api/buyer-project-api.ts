import { apiRequest } from "../../../shared/api/client";
export type ApiPage<T> = {
  content: T[];
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  hasNext: boolean;
};
export type CommunityPost = {
  postId: number;
  postType: string;
  content: string;
  answer: { content: string; updatedAt: string } | null;
  createdAt: string;
};
export function getPublicNotices(id: string, page: number, signal?: AbortSignal) {
  return apiRequest<
    ApiPage<{ noticeId: number; noticeType: string; title: string; createdAt: string }>
  >(`/api/v1/projects/${id}/notices?page=${page}&size=20&sort=LATEST`, { signal });
}

export type ProjectCardResponse = {
  projectId: number;
  projectDisplayCode: string;
  title: string;
  thumbnailUrl: string | null;
  categoryMajor: string;
  categoryMinor: string;
  status: string;
  achievementRate: number;
  sellerDisplayName: string;
  remainingDays: number;
};
export type CategoryGroup = {
  categoryMajor: string;
  categoryMinors: { categoryMinor: string; displayOrder: number }[];
};
export type PublicProject = {
  projectId: string;
  title: string;
  status: string;
  goalAmount: number | null;
  coverImageUrl: string | null;
  introContent: { type: string; value: string }[];
  fundingStatus: {
    currentAmount: number;
    achievementRate: number;
    participantCount: number;
    remainingDays: number | null;
  };
  hasLiveVerification: boolean;
  seller: { sellerId: string; displayName: string };
};
export type PublicReward = {
  rewardId: number;
  name: string;
  description: string;
  imageUrl: string | null;
  price: number;
  isEarlyBird: boolean;
  earlyBirdDiscountedPrice: number | null;
  isLimited: boolean;
  remainingStock: number | null;
  options: { groupId: number; groupName: string; values: { valueId: number; value: string }[] }[];
  soldOut: boolean;
  shippingFee: number | null;
  estimatedDeliveryDays: number | null;
};
export function getCategories(signal?: AbortSignal) {
  return apiRequest<{ categories: CategoryGroup[] }>("/api/v1/categories", { signal });
}
export function getPopularProjects(signal?: AbortSignal) {
  return apiRequest<{ content: ProjectCardResponse[] }>("/api/v1/home/feed?size=20", { signal });
}
export function searchProjects(
  keyword: string,
  sort: string,
  ended: boolean,
  page: number,
  signal?: AbortSignal,
  authenticated = false,
) {
  const params = new URLSearchParams({
    keyword,
    sort,
    subTab: ended ? "ENDED" : "ONGOING",
    page: String(page),
    size: "20",
  });
  return apiRequest<ApiPage<ProjectCardResponse>>(`/api/v1/search/projects?${params}`, {
    signal,
    auth: authenticated,
  });
}
export function getCategoryProjects(
  major: string,
  minor: string,
  sort: string,
  page: number,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({ sort, page: String(page), size: "20" });
  if (minor) params.set("categoryMinor", minor);
  return apiRequest<ApiPage<ProjectCardResponse>>(
    `/api/v1/categories/${encodeURIComponent(major)}/projects?${params}`,
    { signal },
  );
}
export function getPublicProject(id: string, signal?: AbortSignal) {
  return apiRequest<PublicProject>(`/api/v1/projects/${id}`, { signal });
}
export function getPublicRewards(id: string, signal?: AbortSignal) {
  return apiRequest<PublicReward[]>(`/api/v1/projects/${id}/rewards`, { signal });
}
export function getRefundPolicy(id: string, signal?: AbortSignal) {
  return apiRequest<{
    commonPolicy: { simpleRefundDeadline: string; goalFailedAutoRefund: boolean };
    rewardPolicies: { rewardId: number; simpleRefundDisabled: boolean }[];
  }>(`/api/v1/projects/${id}/refund-policy`, { signal });
}
export function getLiveVerifications(id: string, signal?: AbortSignal) {
  return apiRequest<{
    content: { liveVerificationId: number; questionCount: number; answer: string }[];
  }>(`/api/v1/projects/${id}/live-verifications`, { signal });
}
export function getPublicCommunity(id: string, page: number, signal?: AbortSignal) {
  return apiRequest<ApiPage<CommunityPost>>(
    `/api/v1/projects/${id}/community/posts?page=${page}&size=20`,
    { signal },
  );
}
