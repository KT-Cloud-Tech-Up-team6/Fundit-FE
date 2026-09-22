import {
  CUE_SHEET_MAX_DURATION_SEC,
  cueSheetStatuses,
  type CueSheetMode,
  type CueSheetResponse,
} from "../api/live-cue-sheet-api";

/**
 * 큐시트 한 구간. BE는 AI가 준 JSON을 해석하지 않고 그대로 저장·반환하므로
 * 이 모양은 **AI 계약**이다(스텁 응답도 같은 다섯 필드다).
 */
export type CueSheetSegment = {
  id: string;
  title: string;
  duration: number;
  outline: string;
  script: string;
};

/**
 * 화면이 구분해 그려야 하는 상태.
 * - `idle`: 아직 생성을 요청한 적 없다(GET 404).
 * - `generating`: 요청은 받았고 결과는 아직 없다. 스텁 모드에서도 여기서 시작한다.
 * - `completed`: 구간이 채워졌다.
 * - `failed`: BE·AI가 실패로 확정했다.
 */
export type CueSheetPhase = "idle" | "generating" | "completed" | "failed";

/** 원본의 방송 시간 입력은 1~10분이다(BE 상한 600초와 같다). */
export const CUE_SHEET_MAX_MINUTES = CUE_SHEET_MAX_DURATION_SEC / 60;

export function toTargetDurationSec(minutes: number): number {
  const clamped = Math.min(Math.max(Math.floor(minutes), 1), CUE_SHEET_MAX_MINUTES);
  return clamped * 60;
}

/**
 * 초 → 분. 원본 입력이 정수 분이라 올림한다. 값이 없으면 `null`이다 —
 * 서버가 모르는 값을 10분 같은 기본값으로 바꿔 보여주지 않는다.
 */
export function toCueSheetMinutes(totalDurationSec: number | null | undefined): number | null {
  if (typeof totalDurationSec !== "number" || !Number.isFinite(totalDurationSec)) return null;
  if (totalDurationSec <= 0) return null;
  return Math.min(Math.ceil(totalDurationSec / 60), CUE_SHEET_MAX_MINUTES);
}

export function toCueSheetMode(type: "scenario" | "script"): CueSheetMode {
  return type === "scenario" ? "SCENARIO" : "SCRIPT";
}

export function toCueSheetType(
  mode: CueSheetMode | null | undefined,
): "scenario" | "script" | null {
  if (mode === "SCENARIO") return "scenario";
  if (mode === "SCRIPT") return "script";
  return null;
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * `segments` JSON 문자열 → 구간 목록.
 *
 * BE가 AI 응답을 검사하지 않고 통과시키므로 깨진 JSON·예상 밖 모양이 올 수 있다. 그때
 * 화면이 터지지 않도록 **빈 목록**으로 떨어뜨린다. 필드가 빠진 구간은 지어내지 않고 빈
 * 문자열·0으로 두어 화면이 비어 있음을 그대로 보이게 한다.
 */
export function parseCueSheetSegments(segments: string | null | undefined): CueSheetSegment[] {
  if (!segments) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(segments);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item, index) => {
      const duration = Number(item.duration);
      return {
        id: text(item.id) || `segment-${index + 1}`,
        title: text(item.title),
        duration: Number.isFinite(duration) && duration > 0 ? Math.floor(duration) : 0,
        outline: text(item.outline),
        script: text(item.script),
      };
    });
}

/** 저장 본문. 화면에서 편집한 구간을 AI가 주는 모양 그대로 되돌려 보낸다. */
export function toCueSheetSegmentBody(segments: CueSheetSegment[]): CueSheetSegment[] {
  return segments.map((segment) => ({
    id: segment.id,
    title: segment.title,
    duration: segment.duration,
    outline: segment.outline,
    script: segment.script,
  }));
}

export type CueSheetState = {
  phase: CueSheetPhase;
  segments: CueSheetSegment[];
  mode: CueSheetMode | null;
  minutes: number | null;
  failureReason: string | null;
};

const idle: CueSheetState = {
  phase: "idle",
  segments: [],
  mode: null,
  minutes: null,
  failureReason: null,
};

/**
 * 응답 → 화면 상태.
 *
 * **`COMPLETED`인데 구간이 비어 있으면 `completed`로 보지 않는다.** 스텁 모드 AI가 빈
 * 결과를 줄 수 있고(#289 필수 계약 2), 그때 편집기를 열면 편집할 것이 없는 빈 화면이 된다.
 * 사유를 채워 실패로 다룬다 — 판매자에게는 "결과가 없다"가 사실이다.
 */
export function toCueSheetState(response: CueSheetResponse | null | undefined): CueSheetState {
  if (!response) return idle;
  const status = cueSheetStatuses.includes(response.status) ? response.status : null;
  if (!status) return idle;
  const segments = parseCueSheetSegments(response.segments);
  const mode = response.mode === "SCENARIO" || response.mode === "SCRIPT" ? response.mode : null;
  const minutes = toCueSheetMinutes(response.totalDurationSec);
  if (status === "GENERATING") {
    return { phase: "generating", segments: [], mode, minutes, failureReason: null };
  }
  if (status === "FAILED") {
    return { phase: "failed", segments: [], mode, minutes, failureReason: response.failureReason };
  }
  if (!segments.length) {
    return {
      phase: "failed",
      segments: [],
      mode,
      minutes,
      failureReason: response.failureReason ?? "AI가 큐시트 구간을 비워 보냈습니다.",
    };
  }
  return { phase: "completed", segments, mode, minutes, failureReason: null };
}
