import type { Highlight } from "../api/live-api";

export function formatClock(totalSec: number): string {
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = Math.floor(totalSec % 60);
  const clock = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return hours ? `${hours}:${clock}` : clock;
}

/** 재생바 시각. Figma 재생바는 시·분·초를 모두 두 자리(00:00:00)로 적는다. */
export function formatPlaybackTime(totalSec: number): string {
  const sec = Math.max(0, Math.floor(totalSec));
  return [Math.floor(sec / 3600), Math.floor((sec % 3600) / 60), sec % 60]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}

/* 응답 순서를 그대로 믿지 않는다. 타임라인 표시도 이전·다음 이동도 배열 순서를 시간 순서로 본다. */
const byStart = (markers: Highlight[]) => [...markers].sort((a, b) => a.startSec - b.startSec);

/* 재생 위치가 속한 구간의 [시작, 다음 구간 시작) 범위. 구간이나 영상 길이를 모르거나 아직 첫
   구간에 닿지 않았으면 null이라 구간 채팅을 조회하지 않는다 — 범위 없이 부르면 방송 전체를
   받게 되고, 첫 구간 앞에서는 화면의 구간 선택도 비어 있다(BuyerLiveDesktop). */
export function chapterRange(
  markers: Highlight[],
  currentSec: number,
  durationSec: number,
): { fromSec: number; toSec: number } | null {
  if (!markers.length || !durationSec) return null;
  const sorted = byStart(markers);
  let index = -1;
  for (let i = 0; i < sorted.length; i += 1) if (sorted[i].startSec <= currentSec) index = i;
  if (index < 0) return null;
  const fromSec = sorted[index].startSec;
  const toSec = Math.round(sorted[index + 1]?.startSec ?? durationSec);
  return toSec > fromSec ? { fromSec, toSec } : null;
}

/* BE `SceneLabel` → 화면 표시명. AI 파트 요구서「AI 하이라이트 쇼츠 연동」8절의 7종이다
   (BE는 INTRO·CLOSING을 추가 중). 목록에 없는 값은 영문 원문 대신 기타로 적는다. */
const sceneLabelNames: Record<string, string> = {
  INTRO: "도입",
  PRICE_BENEFIT: "가격·혜택",
  DEMO: "시연",
  SPEC: "스펙·기능",
  COMPARISON: "비교",
  AUDIENCE_REACTION: "질문 응답",
  CLOSING: "마무리",
};
export const sceneLabelName = (sceneLabel: string) => sceneLabelNames[sceneLabel] ?? "기타";

/* Figma 숏 클립 배지는 시연 영상·하이라이트 두 가지다(FL_B_PJ_LIVE 1408:42827).
   시연 구간만 시연 영상으로 보고 나머지는 하이라이트로 묶는다(2026-09-23 결정). */
export const clipBadge = (sceneLabel: string) =>
  sceneLabel === "DEMO" ? "시연 영상" : "하이라이트";

/** 주소의 `clip`이 가리키는 쇼츠. 없거나 목록에 없으면 첫 쇼츠, 재생할 영상이 없으면 null. */
export function pickClip(clips: Highlight[], clipId: string | undefined) {
  const playable = clips.filter((clip) => clip.clipUrl);
  return playable.find((clip) => clip.highlightId === clipId) ?? playable[0] ?? null;
}

/** 초 단위 구간을 진행바가 쓰는 0~100 퍼센트로 옮긴다. */
export function toChapters(markers: Highlight[], durationSec: number) {
  if (!durationSec) return [];
  return byStart(markers).map((marker) => ({
    id: marker.highlightId,
    time: formatClock(marker.startSec),
    title: marker.title,
    label: sceneLabelName(marker.sceneLabel),
    progress: Math.min(100, (marker.startSec / durationSec) * 100),
  }));
}
