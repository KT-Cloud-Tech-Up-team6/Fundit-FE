import { apiRequest } from "@/shared/api/client";

/** `GET /api/v1/follows` 항목(BE `FollowListItemResponse`). 이름은 회원 실명, 닉네임은 회원 닉네임이다.
    BE가 null 필드를 응답에서 빼므로 둘 다 없을 수 있다. `profileImageUrl`은 업로드 경로가 없어 늘 빠진다. */
export type FollowedSeller = {
  sellerId: string;
  sellerName?: string;
  sellerNickname?: string;
  /** 그 판매자의 팔로워 수(탈퇴 회원 제외). 내 팔로우도 들어 있다. BE PR #173 이전 서버에는 없다. */
  followerCount?: number;
  /** ♥: 그 판매자 프로젝트들에 달린 찜의 합. BE PR #173 이전 서버에는 없다. */
  wishCount?: number;
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
/** 관심 목록 팔로잉 탭 한 페이지 크기. 찜 탭과 같다. */
export const FOLLOW_LIST_PAGE_SIZE = 20;

/** 관심 목록 팔로잉 탭 한 페이지. BE 정렬은 팔로우한 최신순이다. */
export function getFollows(page: number, signal?: AbortSignal) {
  return apiRequest<FollowPage>(`/api/v1/follows?page=${page}&size=${FOLLOW_LIST_PAGE_SIZE}`, {
    auth: true,
    signal,
  });
}

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
