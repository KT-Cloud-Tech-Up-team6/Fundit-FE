import { apiRequest } from "@/shared/api/client";

/**
 * AI 큐시트(`/api/v1/lives/{liveId}/cue-sheet`).
 *
 * 생성은 **비동기**다. `POST`는 202와 함께 `GENERATING`만 돌려주고 실제 결과는 BE가 AI를
 * 호출해 채운다. FE는 `GET`의 `status`를 폴링한다(BE가 jobId를 두지 않은 이유도 같다 —
 * 세션당 큐시트가 1개다).
 */
export const cueSheetModes = ["SCENARIO", "SCRIPT"] as const;
export type CueSheetMode = (typeof cueSheetModes)[number];

export const cueSheetStatuses = ["GENERATING", "COMPLETED", "FAILED"] as const;
export type CueSheetStatus = (typeof cueSheetStatuses)[number];

/**
 * `segments`는 **JSON 문자열**이다. BE가 AI 계약을 타입으로 박지 않고 그대로 통과시킨다 —
 * 그래서 파싱과 구조 확인은 FE 몫이다(`model/live-cue-sheet.ts`).
 *
 * 생성 요청 직후와 실패 시에는 `segments`가 `null`이다.
 */
export type CueSheetResponse = {
  status: CueSheetStatus;
  mode: CueSheetMode | null;
  totalDurationSec: number;
  segments: string | null;
  failureReason: string | null;
};

/** BE `CueSheetService.MAX_DURATION_SEC`. 넘기면 400이다. */
export const CUE_SHEET_MAX_DURATION_SEC = 600;

export type CueSheetGenerateBody = {
  mode: CueSheetMode;
  targetDurationSec: number;
  demoAvailable?: boolean;
  emphasisPoints?: string[];
  tone?: string;
  mandatoryPhrases?: string[];
};

function cueSheetPath(liveId: string) {
  return `/api/v1/lives/${encodeURIComponent(liveId)}/cue-sheet`;
}

/** 202. 이미 생성 중이면 409다. */
export function requestCueSheet(liveId: string, body: CueSheetGenerateBody) {
  return apiRequest<CueSheetResponse>(cueSheetPath(liveId), {
    auth: true,
    method: "POST",
    body,
  });
}

/** 아직 한 번도 요청하지 않은 LIVE는 404다 — 오류가 아니라 "큐시트 없음"이다. */
export function getCueSheet(liveId: string, signal?: AbortSignal) {
  return apiRequest<CueSheetResponse>(cueSheetPath(liveId), { auth: true, signal });
}

/** 판매자 직접 수정. 빈 배열은 BE가 400으로 막는다. */
export function saveCueSheetSegments(liveId: string, segments: unknown[]) {
  return apiRequest<CueSheetResponse>(cueSheetPath(liveId), {
    auth: true,
    method: "PATCH",
    body: { segments },
  });
}
