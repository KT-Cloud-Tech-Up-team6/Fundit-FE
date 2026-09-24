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
  projectPublicId?: string | null;
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
/**
 * LIVE 체크 탭. 답변을 등록한 질문만 온다. 질문 문구·건수는 방송 종료 뒤 BE가 받은 질문 요약에서
 * 채우므로, 요약을 받기 전에 등록된 항목은 `questionText: null`·`questionCount: 0`이다.
 */
export function getLiveVerifications(id: string, signal?: AbortSignal) {
  return apiRequest<{
    content: {
      liveVerificationId: number;
      questionSummaryId: string;
      questionText: string | null;
      questionCount: number;
      answer: string;
    }[];
  }>(`/api/v1/projects/${id}/live-verifications`, { signal });
}
export function getPublicCommunity(id: string, page: number, signal?: AbortSignal) {
  return apiRequest<ApiPage<CommunityPost>>(
    `/api/v1/projects/${id}/community/posts?page=${page}&size=20`,
    { signal },
  );
}
