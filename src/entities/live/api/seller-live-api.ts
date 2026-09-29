import { apiRequest } from "@/shared/api/client";

/** BE LiveStatus. 화면 탭은 3개지만 상태는 5종이다(#283). */
export const liveStatuses = ["DRAFT", "SCHEDULED", "LIVE", "ENDED", "ERROR"] as const;
export type LiveStatus = (typeof liveStatuses)[number];

/* LiveSummaryResponse에는 title·category가 없다. 카드 문구는 introText다.
   없는 필드를 여기에 추가하지 않는다 — 추가하면 화면이 undefined를 그린다. 판매자용 `/mine` 목록과
   소비자 목록이 같은 형식이라, 소비자 목록에만 오는 값은 선택 필드로 둔다. */
export type LiveSummaryResponse = {
  liveId: string;
  introText: string | null;
  status: LiveStatus;
  projectId: string;
  thumbnailUrl: string | null;
  scheduledStartAt: string | null;
  likeCount: number;
  createdAt: string;
  /** 소비자 목록의 `sort=viewerCount`(실시간 순위)에서만 온다. IVS 실시간 시청자 수다. */
  viewerCount?: number;
  /** 판매자 닉네임(BE PR #165). 소비자 목록만 채우고, 닉네임이 없거나 member 조회가 실패하면 빠진다. */
  sellerNickname?: string | null;
  /** 판매자 회원 ID(BE PR #185). 팔로우 목록의 `sellerId`와 같은 값이다. 배포 전 서버에는 없다. */
  sellerId?: string;
  /** 실제 방송 시작 시각(BE PR #185). 시작 전이면 null이고 BE가 null 키를 빼기도 한다. */
  actualStartAt?: string | null;
};

export type LivePage = {
  content: LiveSummaryResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
};

/** 상태별 건수(BE `LiveStatusCountResponse`). 키는 상태명을 소문자로 적은 값이다. */
export type LiveStatusCounts = {
  draft: number;
  scheduled: number;
  live: number;
  ended: number;
  error: number;
};

/* 한 페이지 8건은 FL_S_PR_LIST_1의 2열 × 4행 그리드에 맞춘 값이고
   판매자 프로젝트 목록(getSellerProjects)과 같다. */
export const LIVE_PAGE_SIZE = 8;

export type MyLivesQuery = {
  /** 비우면 내 LIVE 전체다. `status`는 List라 여러 값을 쉼표로 이어 보낸다. */
  statuses?: readonly LiveStatus[];
  projectId?: string;
  search?: string;
  /** 1부터 센다. 서버는 0부터라 여기서 한 번만 맞춘다. */
  page?: number;
  size?: number;
};

export function getMyLives(
  { statuses, projectId, search, page = 1, size = LIVE_PAGE_SIZE }: MyLivesQuery,
  signal?: AbortSignal,
) {
  const query = new URLSearchParams({
    page: String(page - 1),
    size: String(size),
  });
  if (statuses?.length) query.set("status", statuses.join(","));
  if (projectId) query.set("projectId", projectId);
  if (search) query.set("q", search);
  return apiRequest<LivePage>(`/api/v1/lives/mine?${query}`, { auth: true, signal });
}

/** 페이지 없이 고르는 목록(임시저장 불러오기)용. `hasNext`가 끝날 때까지 받아 한 목록으로 합친다. */
export async function getAllMyLives(query: Omit<MyLivesQuery, "page">, signal?: AbortSignal) {
  const content: LiveSummaryResponse[] = [];
  const seen = new Set<string>();
  for (let page = 1; ; page += 1) {
    const result = await getMyLives({ ...query, page }, signal);
    /* 최신순이라 받는 사이 새 LIVE가 생기면 앞 페이지 항목이 다음 페이지로 밀려 두 번 온다. */
    for (const item of result.content) {
      if (seen.has(item.liveId)) continue;
      seen.add(item.liveId);
      content.push(item);
    }
    /* 빈 페이지·마지막 페이지에서도 멈춘다. hasNext가 잘못 오면 끝없이 부르게 된다. */
    if (!result.hasNext || result.content.length === 0 || page >= result.totalPages)
      return { ...result, content };
  }
}

export function getLiveStatusCounts(signal?: AbortSignal) {
  return apiRequest<LiveStatusCounts>("/api/v1/lives/status-counts", { auth: true, signal });
}
