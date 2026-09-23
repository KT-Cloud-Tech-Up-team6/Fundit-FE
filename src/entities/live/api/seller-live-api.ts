import { apiRequest } from "@/shared/api/client";

/** BE LiveStatus. 화면 탭은 3개지만 상태는 5종이다(#283). */
export const liveStatuses = ["DRAFT", "SCHEDULED", "LIVE", "ENDED", "ERROR"] as const;
export type LiveStatus = (typeof liveStatuses)[number];

/* LiveSummaryResponse에는 title·category가 없다. 카드 문구는 introText다.
   없는 필드를 여기에 추가하지 않는다 — 추가하면 화면이 undefined를 그린다. */
export type LiveSummaryResponse = {
  liveId: string;
  introText: string | null;
  status: LiveStatus;
  projectId: string;
  thumbnailUrl: string | null;
  scheduledStartAt: string | null;
  likeCount: number;
  createdAt: string;
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

export function getLiveStatusCounts(signal?: AbortSignal) {
  return apiRequest<LiveStatusCounts>("/api/v1/lives/status-counts", { auth: true, signal });
}
