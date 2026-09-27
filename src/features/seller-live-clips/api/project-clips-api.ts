import { getMyLives, type LiveSummaryResponse } from "@/entities/live/api/seller-live-api";
import { getHighlights } from "@/features/live-integration/api/live-api";
import { toLiveClips } from "../model/live-clips";

/* BE `/lives/mine`의 기본 페이지 크기다. */
const ENDED_LIVES_PAGE_SIZE = 20;

/**
 * 프로젝트의 숏 클립 전체. 프로젝트 단위 클립 목록 API가 없어 종료된 LIVE를 모두 받은 뒤
 * LIVE마다 판매자 하이라이트 목록을 받아 합친다. 하나라도 실패하면 목록 전체를 실패로 둔다 —
 * 일부만 보여 주면 총 개수와 페이지가 사실과 달라진다.
 */
export async function getProjectClips(projectId: string, signal?: AbortSignal) {
  const lives: LiveSummaryResponse[] = [];
  for (let page = 1; ; page += 1) {
    const result = await getMyLives(
      { projectId, statuses: ["ENDED"], page, size: ENDED_LIVES_PAGE_SIZE },
      signal,
    );
    lives.push(...result.content);
    if (!result.hasNext) break;
  }
  const highlights = await Promise.all(lives.map((live) => getHighlights(live.liveId, signal)));
  return toLiveClips(lives.map((live, index) => ({ live, clips: highlights[index].clips })));
}
