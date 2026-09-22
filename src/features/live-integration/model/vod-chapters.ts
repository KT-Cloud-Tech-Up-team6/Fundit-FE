import type { Highlight } from "../api/live-api";

export function formatClock(totalSec: number): string {
  const minutes = Math.floor(totalSec / 60);
  const seconds = Math.floor(totalSec % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/* 재생 위치가 속한 구간의 [시작, 다음 구간 시작) 범위. 구간이나 영상 길이를 모르면 null이라
   구간 채팅을 조회하지 않는다 — 범위 없이 부르면 방송 전체를 받게 된다. */
export function chapterRange(
  markers: Highlight[],
  currentSec: number,
  durationSec: number,
): { fromSec: number; toSec: number } | null {
  if (!markers.length || !durationSec) return null;
  const sorted = [...markers].sort((a, b) => a.startSec - b.startSec);
  let index = 0;
  for (let i = 0; i < sorted.length; i += 1) if (sorted[i].startSec <= currentSec) index = i;
  const fromSec = sorted[index].startSec;
  const toSec = Math.round(sorted[index + 1]?.startSec ?? durationSec);
  return toSec > fromSec ? { fromSec, toSec } : null;
}

/** 초 단위 구간을 진행바가 쓰는 0~100 퍼센트로 옮긴다. */
export function toChapters(markers: Highlight[], durationSec: number) {
  if (!durationSec) return [];
  return markers.map((marker) => ({
    time: formatClock(marker.startSec),
    title: marker.title,
    label: marker.sceneLabel,
    progress: Math.min(100, (marker.startSec / durationSec) * 100),
  }));
}
