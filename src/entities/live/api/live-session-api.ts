import { apiRequest } from "@/shared/api/client";
import type { LiveStatus } from "./seller-live-api";

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

/**
 * 판매자 LIVE 단건(BE `LiveDetailResponse`). `viewerCount`·`elapsedSeconds`는 `LIVE`일 때만
 * 채워지고 그 밖에는 `null`이다.
 */
export type LiveDetailResponse = {
  liveId: string;
  status: LiveStatus;
  projectId: string;
  introText: string | null;
  thumbnailUrl: string | null;
  scheduledStartAt: string | null;
  likeCount: number;
  createdAt: string;
  viewerCount: number | null;
  elapsedSeconds: number | null;
};

export function getLiveDetail(liveId: string, signal?: AbortSignal) {
  return apiRequest<LiveDetailResponse>(`/api/v1/lives/${encodeURIComponent(liveId)}`, {
    auth: true,
    signal,
  });
}

/**
 * OBS 같은 송출 프로그램에 넣을 값(BE #147). 본인 LIVE만 조회하고 LIVE·채널이 없으면 404다.
 * BE는 키를 저장하지 않고 요청할 때마다 IVS에서 읽는다. 응답에 Cache-Control이 없어 비밀값이
 * 브라우저 디스크 캐시에 남지 않게 no-store로 받는다.
 */
export type StreamInfoResponse = { ingestEndpoint: string; streamKey: string };

export function getStreamInfo(liveId: string, signal?: AbortSignal) {
  return apiRequest<StreamInfoResponse>(`/api/v1/lives/${encodeURIComponent(liveId)}/stream-info`, {
    auth: true,
    cache: "no-store",
    signal,
  });
}

/**
 * 송출 시작. DRAFT·SCHEDULED·ERROR에서만 LIVE로 바뀌고 이미 LIVE거나 ENDED면 409다.
 * BE가 채팅방을 만들고 AI 상품정보 준비를 시작하며, 채팅방 생성이 실패하면 세션이 ERROR가 된다.
 */
export function startLive(liveId: string) {
  return apiRequest<LiveStatusResponse>(`/api/v1/lives/${encodeURIComponent(liveId)}/start`, {
    auth: true,
    method: "POST",
  });
}

/** 진행 중이 아니면 409다. 종료는 되돌릴 수 없다. */
export function endLive(liveId: string) {
  return apiRequest<LiveStatusResponse>(`/api/v1/lives/${encodeURIComponent(liveId)}/end`, {
    auth: true,
    method: "POST",
  });
}

export function updateLiveSettings(liveId: string, body: LiveSettingsBody) {
  return apiRequest<LiveStatusResponse>(`/api/v1/lives/${encodeURIComponent(liveId)}/settings`, {
    auth: true,
    method: "PATCH",
    body,
  });
}
