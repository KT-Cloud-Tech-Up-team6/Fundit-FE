import { apiRequest } from "@/shared/api/client";

/** BE LiveStatus. 화면 탭은 3개지만 상태는 5종이다(#283). */
export const liveStatuses = ["DRAFT", "SCHEDULED", "LIVE", "ENDED", "ERROR"] as const;
export type LiveStatus = (typeof liveStatuses)[number];

/* LiveSummaryResponse에는 title·category·viewerCount가 없다. 카드 문구는 introText다.
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

/* 한 페이지 8건은 FL_S_PR_LIST_1의 2열 × 4행 그리드에 맞춘 값이고
   판매자 프로젝트 목록(getSellerProjects)과 같다. */
export const LIVE_PAGE_SIZE = 8;

/**
 * `status`를 주지 않으면 내 LIVE 전체를 받는다. 준비중 탭이 이 경로를 쓴다 —
 * `status`가 단일값이라 DRAFT·SCHEDULED를 한 번에 조회할 수 없다.
 */
export function getMyLives(status: LiveStatus | undefined, page: number, signal?: AbortSignal) {
  const query = new URLSearchParams({
    page: String(page - 1),
    size: String(LIVE_PAGE_SIZE),
  });
  if (status) query.set("status", status);
  return apiRequest<LivePage>(`/api/v1/lives/mine?${query}`, { auth: true, signal });
}
