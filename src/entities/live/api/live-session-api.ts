import { apiRequest } from "@/shared/api/client";
import type { LivePage, LiveStatus, LiveSummaryResponse } from "./seller-live-api";

/* #283이 연결한 `seller-live-api.ts`는 목록 전용이라 건드리지 않는다(#289 필수 계약 4).
   생성·설정 저장은 같은 서비스의 다른 엔드포인트라 파일만 나눈다. */

/** `POST /api/v1/lives`의 201 응답. 생성 직후 상태는 항상 DRAFT다. */
export type LiveCreateResponse = {
  liveId: string;
  status: LiveStatus;
};

/** 설정 저장·시작·종료가 공유하는 응답(BE `LiveStatusResponse`). */
export type LiveStatusResponse = {
  liveId: string;
  status: LiveStatus;
  scheduledStartAt: string | null;
  actualStartAt: string | null;
  actualEndAt: string | null;
};

/**
 * `PATCH /settings`는 부분 업데이트다. **보내지 않은 필드는 서버가 건드리지 않는다** —
 * 값을 지우려고 `null`을 보내면 안 되고, 바꾸지 않을 필드는 키 자체를 빼야 한다.
 *
 * 연결 프로젝트는 여기 없다. BE가 "변경 불가"로 못박았고 바꾸려면 LIVE를 새로 만든다.
 */
export type LiveSettingsBody = {
  category?: { major: string; minor: string | null };
  /** BE `@Size(max = 200)`. 화면의 입력 제한도 이 값을 따른다. */
  introText?: string;
  thumbnailUrl?: string;
  /** ISO-8601 UTC(`Instant`). */
  scheduledStartAt?: string;
};

export function createLive(projectId: string) {
  return apiRequest<LiveCreateResponse>("/api/v1/lives", {
    auth: true,
    method: "POST",
    body: { projectId },
  });
}

export function updateLiveSettings(liveId: string, body: LiveSettingsBody) {
  return apiRequest<LiveStatusResponse>(`/api/v1/lives/${encodeURIComponent(liveId)}/settings`, {
    auth: true,
    method: "PATCH",
    body,
  });
}

/* liveId 하나로 LIVE를 읽는 판매자 API가 없다. `/playback`은 공개용이라 DRAFT·SCHEDULED에서
   404이고, 큐시트 화면은 바로 그 준비 단계에서 열린다. 그래서 내 LIVE 목록에서 찾는다.
   BE에 단건 조회가 생기면 이 우회를 걷는다. */
const LOOKUP_SIZE = 100;
const LOOKUP_MAX_PAGES = 5;

/**
 * 내 LIVE 목록에서 `liveId` 한 건을 찾는다. 찾지 못하면 `null`이다.
 *
 * 최대 {@link LOOKUP_MAX_PAGES} 페이지까지만 훑는다 — 그보다 뒤에 있으면 못 찾은 것으로
 * 다루고 화면이 "정보 없음"을 표시한다. 없는 값을 지어내지 않는다.
 */
export async function findMyLive(
  liveId: string,
  signal?: AbortSignal,
): Promise<LiveSummaryResponse | null> {
  for (let page = 0; page < LOOKUP_MAX_PAGES; page++) {
    const query = new URLSearchParams({ page: String(page), size: String(LOOKUP_SIZE) });
    const result = await apiRequest<LivePage>(`/api/v1/lives/mine?${query}`, {
      auth: true,
      signal,
    });
    const found = (result?.content ?? []).find((item) => item.liveId === liveId);
    if (found) return found;
    if (!result?.hasNext) return null;
  }
  return null;
}
