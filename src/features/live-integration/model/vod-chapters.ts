import type { Highlight } from "../api/live-api";

export function formatClock(totalSec: number): string {
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = Math.floor(totalSec % 60);
  const clock = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return hours ? `${hours}:${clock}` : clock;
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

/** 초 단위 구간을 진행바가 쓰는 0~100 퍼센트로 옮긴다. */
export function toChapters(markers: Highlight[], durationSec: number) {
  if (!durationSec) return [];
  return byStart(markers).map((marker) => ({
    id: marker.highlightId,
    time: formatClock(marker.startSec),
    title: marker.title,
    label: marker.sceneLabel,
    progress: Math.min(100, (marker.startSec / durationSec) * 100),
  }));
}
