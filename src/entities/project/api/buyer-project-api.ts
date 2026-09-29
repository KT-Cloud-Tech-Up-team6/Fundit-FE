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
  /** 카드의 대분류 자리에 쓴다(LIVE 홈 실시간 순위, #445). BE는 null 필드를 뺀다. */
  categoryMajor?: string | null;
  goalAmount: number | null;
  coverImageUrl: string | null;
  introContent: { type: string; value: string }[];
  fundingStatus: {
    currentAmount: number;
    achievementRate: number;
    participantCount: number;
    /** 마감이 없으면 BE가 null로 계산하고 키를 뺀다(non_null). */
    remainingDays?: number | null;
    /** 펀딩 마감 시각(UTC ISO). 마감이 없으면 BE가 키를 뺀다. */
    fundingDeadline?: string;
  };
  hasLiveVerification: boolean;
  seller: { sellerId: string; displayName: string };
  pageSummary?: ProjectPageSummary | null;
};
/** 상세 페이지 AI 요약(BE #169, PR #184). 생성 중이면 `sections` 없이 `GENERATING`이고, 요약이 없거나
    실패하면 BE가 키를 뺀다. `role`은 WHAT(무엇을)·WHY(왜)다. */
export type ProjectPageSummary = {
  status: string;
  sections?: { role: string; headline: string; description: string }[] | null;
};
/** BE `RewardConsumerResponse`(sortOrder 순). BE는 null 필드를 JSON에서 빼므로 값이 없을 수
    있는 필드는 선택 키다. */
export type PublicReward = {
  rewardId: number;
  rewardDisplayCode: string;
  name: string;
  description: string;
  imageUrl?: string;
  price: number;
  isEarlyBird: boolean;
  earlyBirdDiscountType?: "AMOUNT" | "RATE";
  earlyBirdDiscountValue?: number;
  earlyBirdDiscountedPrice?: number;
  isLimited: boolean;
  /** 재고를 모르면 빠진다. */
  remainingStock?: number;
  options: { groupId: number; groupName: string; values: { valueId: number; value: string }[] }[];
  soldOut: boolean;
  shippingFee?: number;
  /** 펀딩 종료 후 N일(BE `Reward` 주석). */
  estimatedDeliveryDays?: number;
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
/**
 * 홈 피드(search-service). `POPULAR`는 "지금 주목받는 프로젝트"(참여자·찜 많은 순), `DEADLINE`은
 * "마감 임박 프로젝트"(마감이 지나지 않은 진행 중 프로젝트를 마감 가까운 순, BE-19)다.
 * 페이지 없이 `size`개(기본 20, 최대 100)만 오고, 카드 모양은 검색 상품 탭과 같다. 비인증이다.
 */
export function getHomeFeed(sort: "POPULAR" | "DEADLINE", size: number, signal?: AbortSignal) {
  const params = new URLSearchParams({ sort, size: String(size) });
  return apiRequest<{ content: ProjectCardResponse[] }>(`/api/v1/home/feed?${params}`, {
    signal,
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
