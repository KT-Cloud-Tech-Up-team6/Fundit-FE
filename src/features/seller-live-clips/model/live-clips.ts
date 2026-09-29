import type { LiveSummaryResponse } from "@/entities/live/api/seller-live-api";
import type { Highlight } from "@/features/live-integration/api/live-api";
import { clipBadge, formatClock } from "@/features/live-integration/model/vod-chapters";
import { isApiError } from "@/shared/api/api-error";

/** Figma LIVE 클립 관리(2321:46422)는 카드 2열 × 3행이다. */
export const CLIPS_PER_PAGE = 6;

export type LiveClip = {
  liveId: string;
  highlightId: string;
  title: string;
  /** DEMO면 "시연 영상", 나머지는 "하이라이트"(#317 규칙). */
  badge: string;
  /** "09.15". 클립 생성일이다. */
  dateLabel: string | null;
  /** "00:32". 끝 시각이 없으면 길이를 모른다. */
  durationLabel: string | null;
  clipUrl: string | null;
  /** AI가 만든 클립 썸네일. 채워지기 전에는 비어 있다. */
  thumbnailUrl: string | null;
  /** 클립 썸네일도 첫 프레임도 그리지 못할 때 대신 보여 줄 원본 LIVE 썸네일. */
  liveThumbnailUrl: string | null;
  isPublic: boolean;
};

const monthDay = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  month: "2-digit",
  day: "2-digit",
});

/** 한국 시간 기준 "MM.DD". 읽을 수 없는 값이면 날짜를 비운다. */
export function formatClipDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = monthDay.formatToParts(date);
  const part = (type: "month" | "day") => parts.find((item) => item.type === type)?.value;
  return `${part("month")}.${part("day")}`;
}

export function formatClipDuration(startSec: number, endSec: number | null) {
  return endSec == null ? null : formatClock(Math.max(0, Math.round(endSec - startSec)));
}

/**
 * 최신 LIVE 먼저(서버 순서 그대로), 한 LIVE 안에서는 시작 시각 순서로 잇는다.
 * 생성이 끝난 클립만 담는다 — 생성 중·실패 클립은 공개할 수 없어(BE 409) 고를 것이 없다.
 * live-service는 null 필드를 빼고 보내(non_null) 제목·영상·썸네일은 키가 없을 수 있다.
 */
export function toLiveClips(
  entries: readonly { live: LiveSummaryResponse; clips: readonly Highlight[] }[],
): LiveClip[] {
  return entries.flatMap(({ live, clips }) =>
    clips
      .filter((clip) => clip.generationStatus === "COMPLETED")
      .sort((a, b) => a.startSec - b.startSec)
      .map((clip) => ({
        liveId: live.liveId,
        highlightId: clip.highlightId,
        title: clip.title ?? "제목 없음",
        badge: clipBadge(clip.sceneLabel),
        dateLabel: formatClipDate(clip.createdAt),
        durationLabel: formatClipDuration(clip.startSec, clip.endSec),
        clipUrl: clip.clipUrl ?? null,
        thumbnailUrl: clip.thumbnailUrl ?? null,
        liveThumbnailUrl: live.thumbnailUrl ?? null,
        isPublic: clip.isPublic,
      })),
  );
}

/** 저장 전 토글 값. highlightId → 바꾼 공개 여부. */
export type PendingVisibility = Readonly<Record<string, boolean>>;

export const isShownPublic = (clip: LiveClip, pending: PendingVisibility) =>
  pending[clip.highlightId] ?? clip.isPublic;

/** 서버 값과 달라진 클립만 저장 대상이다. 켰다가 되돌린 클립은 보내지 않는다. */
export const changedClips = (clips: readonly LiveClip[], pending: PendingVisibility) =>
  clips.filter((clip) => isShownPublic(clip, pending) !== clip.isPublic);

export type SaveFailure = { clip: LiveClip; reason: string };

/** `Promise.allSettled` 결과를 요청한 클립 순서대로 성공·실패로 나눈다. */
export function splitSaveResults(
  changes: readonly LiveClip[],
  results: readonly PromiseSettledResult<unknown>[],
) {
  const saved: LiveClip[] = [];
  const failed: SaveFailure[] = [];
  results.forEach((result, index) => {
    if (result.status === "fulfilled") saved.push(changes[index]);
    else
      failed.push({
        clip: changes[index],
        /* 409 "생성에 실패한 항목은 공개할 수 없습니다." 같은 BE 문구를 그대로 보여 준다. */
        reason: isApiError(result.reason)
          ? result.reason.message
          : "네트워크 연결을 확인한 뒤 다시 시도해 주세요.",
      });
  });
  return { saved, failed };
}

/**
 * 저장에 성공한 클립을 요청한 공개 여부로 맞춘다. 다시 조회가 끝나기 전에도 화면이 저장 결과를 보인다.
 * `saved`는 저장 전 값이라 요청 값은 그 반대다. 현재 목록 값을 뒤집지 않는 것은, 저장하는 사이에
 * 목록이 먼저 새로 받아져 이미 요청 값이면 뒤집기가 다시 원래 값으로 돌려놓기 때문이다.
 */
export function applySaved(clips: readonly LiveClip[], saved: readonly LiveClip[]) {
  const requested = new Map(saved.map((clip) => [clip.highlightId, !clip.isPublic]));
  return clips.map((clip) => {
    const isPublic = requested.get(clip.highlightId);
    return isPublic === undefined ? clip : { ...clip, isPublic };
  });
}

/** 실패한 클립만 저장 대기로 남긴다. 다시 [저장]하면 그 클립만 다시 보낸다. */
export const pendingAfterFailure = (failed: readonly SaveFailure[]): PendingVisibility =>
  Object.fromEntries(failed.map(({ clip }) => [clip.highlightId, !clip.isPublic]));

/** 1부터 센다. 숫자가 아니면 첫 페이지, 마지막 페이지를 넘으면 마지막 페이지다. */
export function clipPage(requested: number, total: number) {
  const totalPages = Math.max(1, Math.ceil(total / CLIPS_PER_PAGE));
  const page =
    Number.isSafeInteger(requested) && requested > 0 ? Math.min(requested, totalPages) : 1;
  return { page, totalPages };
}
