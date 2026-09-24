import { apiRequest } from "@/shared/api/client";

/** `GET /api/v1/follows` 항목(BE `FollowListItemResponse`). */
export type FollowedSeller = {
  sellerId: string;
  sellerName: string;
  sellerNickname: string;
  createdAt: string;
};

type FollowPage = {
  content: FollowedSeller[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
};

/** BE가 받는 한 페이지 최대 크기다. */
const FOLLOW_PAGE_SIZE = 100;

/* 판매자 한 명을 팔로우하는지 묻는 API가 없어 LIVE 시청 화면의 팔로우 여부와 LIVE 메인의
   "팔로우한 창작자" 모두 내 팔로우 목록 전체로 판단한다. 두 화면이 같은 결과를 쓰도록 키를 하나로 둔다. */
export const followsQueryKey = (memberId: string | undefined) => ["follows", memberId] as const;

export async function getAllFollows(signal?: AbortSignal) {
  const follows: FollowedSeller[] = [];
  for (let page = 0; ; page += 1) {
    const result = await apiRequest<FollowPage>(
      `/api/v1/follows?page=${page}&size=${FOLLOW_PAGE_SIZE}`,
      { auth: true, signal },
    );
    follows.push(...result.content);
    if (!result.hasNext) return follows;
  }
}

/* 팔로우·언팔로우 모두 idempotent하다(BE `FollowService`). 자기 자신은 400 `INVALID_INPUT`이다. */
export const followSeller = (sellerId: string) =>
  apiRequest<{ sellerId: string; following: boolean }>(
    `/api/v1/follows/${encodeURIComponent(sellerId)}`,
    { auth: true, method: "PUT" },
  );
export const unfollowSeller = (sellerId: string) =>
  apiRequest<void>(`/api/v1/follows/${encodeURIComponent(sellerId)}`, {
    auth: true,
    method: "DELETE",
  });
