import { http, HttpResponse } from "msw";

import type { LiveSummaryResponse } from "@/entities/live/api/seller-live-api";
import type { ProjectClip } from "@/features/live-integration/api/live-api";

import { FIXTURE_PROJECT_ID } from "./fixtures";

/* 목업 프로젝트의 종료된 LIVE 한 건과 공개 숏 클립 한 건. 상품 상세는 종료된 LIVE가 있어야 LIVE 체크 탭을
   보이므로(#461), 이 목록이 없으면 e2e가 탭을 찾지 못한다(#510). 건수는 1건이라 "0건"으로 끝나지 않는다. */
const FIXTURE_ENDED_LIVE_ID = "55555555-5555-4555-8555-555555555555";

const fixtureEndedLive: LiveSummaryResponse = {
  liveId: FIXTURE_ENDED_LIVE_ID,
  introText: "감성 캠핑 무드등 세트 라이브",
  status: "ENDED",
  projectId: FIXTURE_PROJECT_ID,
  thumbnailUrl: null,
  scheduledStartAt: "2026-09-20T11:00:00Z",
  likeCount: 12,
  createdAt: "2026-09-19T10:00:00Z",
  sellerNickname: "무드등 공방",
  actualStartAt: "2026-09-20T11:00:00Z",
};

const fixtureClip: ProjectClip = {
  liveId: FIXTURE_ENDED_LIVE_ID,
  highlightId: "66666666-6666-4666-8666-666666666666",
  sceneLabel: "DEMO",
  title: "무드등 밝기 조절 시연",
  clipUrl: null,
  thumbnailUrl: null,
  createdAt: "2026-09-20T12:00:00Z",
};

const livePage = (content: LiveSummaryResponse[]) => ({
  content,
  page: 0,
  size: 20,
  totalElements: content.length,
  totalPages: content.length ? 1 : 0,
  hasNext: false,
});

/* 프로젝트별 조회(상품 상세 LIVE 체크 탭)만 목업으로 답한다. projectId 없는 조회(LIVE 메인 등)는 목업이
   없어 지금처럼 그대로 보낸다(반환값이 없으면 다음 핸들러가 받고, 없으면 실제 요청이 나간다). */
export const liveHandlers = [
  http.get("*/api/v1/lives", ({ request }) => {
    const params = new URL(request.url).searchParams;
    const projectId = params.get("projectId");
    if (!projectId) return undefined;
    const ended = projectId === FIXTURE_PROJECT_ID && params.get("status") === "ENDED";
    return HttpResponse.json(livePage(ended ? [fixtureEndedLive] : []));
  }),

  http.get("*/api/v1/lives/highlights", ({ request }) => {
    const projectId = new URL(request.url).searchParams.get("projectId");
    if (!projectId) return undefined;
    const content = projectId === FIXTURE_PROJECT_ID ? [fixtureClip] : [];
    return HttpResponse.json({ content, totalElements: content.length });
  }),
];
