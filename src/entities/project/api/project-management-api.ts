import { apiRequest } from "../../../shared/api/client";

export type ManagementProject = {
  projectId: string;
  title: string | null;
  status: string;
  goalAmount: number | null;
  coverImageUrl: string | null;
};
export function getManagementProject(id: string, signal?: AbortSignal) {
  return apiRequest<ManagementProject>(`/api/v1/projects/${id}/preview`, { auth: true, signal });
}

export type ApiPage<T> = {
  content: T[];
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  hasNext: boolean;
};
export type FundingStatus = {
  currentAmount: number;
  achievementRate: number;
  participantCount: number;
  openNotifyCount: number;
  wishCount: number;
  rewardStats: {
    rewardId: number;
    optionValueId: number | null;
    purchasedQuantity: number;
    purchasedAmount: number;
  }[];
  remainingDays: number | null;
  lastSyncedAt: string | null;
};
export type CommunityPost = {
  postId: number;
  postType: "QUESTION" | "CHEER";
  content: string;
  answer: { content: string; updatedAt: string } | null;
  createdAt: string;
};
export type Notice = { noticeId: number; noticeType: string; title: string; createdAt: string };
export type NoticeDetail = Notice & { content: string };
export type NoticeComment = { commentId: number; content: string; createdAt: string };
export const noticeTypes = {
  REWARD_INFO: "리워드 안내",
  EVENT: "이벤트",
  PRODUCTION_UPDATE: "제작 현황",
  SHIPPING_INFO: "배송 안내",
  ACHIEVEMENT_RATE: "달성률",
  EXCHANGE_REFUND: "교환·환불",
  PAYMENT_INFO: "결제 안내",
  FAQ: "자주 묻는 질문",
};
export function getFundingStatus(id: string, signal?: AbortSignal) {
  return apiRequest<FundingStatus>(`/api/v1/projects/${id}/funding-status`, { auth: true, signal });
}
export function getWishStats(id: string, signal?: AbortSignal) {
  return apiRequest<{ wishCount: number; openNotifyCount: number }>(
    `/api/v1/projects/${id}/wish-stats`,
    { auth: true, signal },
  );
}
export function getRewardNames(id: string, signal?: AbortSignal) {
  return apiRequest<{ rewardId: number; name: string }[]>(`/api/v1/projects/${id}/rewards/mine`, {
    auth: true,
    signal,
  });
}
export function getCommunityPosts(
  id: string,
  page: number,
  postType: string,
  answeredOnly: boolean,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({
    page: String(page),
    size: "20",
    answeredOnly: String(answeredOnly),
  });
  if (postType) params.set("postType", postType);
  return apiRequest<ApiPage<CommunityPost>>(`/api/v1/projects/${id}/community/posts?${params}`, {
    auth: true,
    signal,
  });
}
export function answerCommunityPost(id: number, content: string) {
  return apiRequest(`/api/v1/community/posts/${id}/answer`, {
    auth: true,
    method: "POST",
    body: { content },
  });
}
export function getNotices(id: string, page: number, signal?: AbortSignal) {
  return apiRequest<ApiPage<Notice>>(
    `/api/v1/projects/${id}/notices?page=${page}&size=20&sort=LATEST`,
    { signal },
  );
}
export function createNotice(
  id: string,
  body: { noticeType: string; title: string; content: string },
) {
  return apiRequest<Notice>(`/api/v1/projects/${id}/notices`, { auth: true, method: "POST", body });
}
export function getNoticeComments(id: number, page: number, signal?: AbortSignal) {
  return apiRequest<ApiPage<NoticeComment>>(`/api/v1/notices/${id}/comments?page=${page}&size=20`, {
    signal,
  });
}
export function getNoticeDetail(id: number, signal?: AbortSignal) {
  return apiRequest<NoticeDetail>(`/api/v1/notices/${id}`, { signal });
}

export function updateNotice(id: number, body: { title?: string; content?: string }) {
  return apiRequest<NoticeDetail>(`/api/v1/notices/${id}`, { auth: true, method: "PATCH", body });
}
export function createNoticeComment(id: number, content: string) {
  return apiRequest(`/api/v1/notices/${id}/comments`, {
    auth: true,
    method: "POST",
    body: { content },
  });
}
