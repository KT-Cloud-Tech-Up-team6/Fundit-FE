/* 프로젝트 상세 LIVE 체크 탭의 "LIVE 다시 보기"(FL_B_PJ_LIVE `1541:50492`) 카드 값. 종료된 라이브는
   `GET /api/v1/lives?status=ENDED&projectId=`, 숏 클립은 `GET /api/v1/lives/highlights?projectId=`에서 온다(#319). */
import type { LiveSummaryResponse } from "@/entities/live/api/seller-live-api";
import type { ProjectClip } from "@/features/live-integration/api/live-api";
import { clipBadge } from "@/features/live-integration/model/vod-chapters";
import { realLiveTitle } from "@/features/buyer-live/model/live-main-real";
import { formatClipDate } from "@/features/seller-live-clips/model/live-clips";

export type VideoCard = {
  id: string;
  href: string;
  title: string;
  /** "09.15". 모르면 비운다. */
  date?: string | null;
  image?: string | null;
  /** 포스터 이미지가 없을 때 첫 프레임을 쓸 영상. */
  video?: string | null;
  /** 숏 클립 배지(시연 영상·하이라이트). */
  badge?: string;
};

/** 종료된 라이브는 항상 공개라(2026-09-23 PM) 목록의 모든 방송이 다시보기로 간다. 날짜는 실제 방송 시작일이다. */
export function endedLiveVideo(live: LiveSummaryResponse): VideoCard {
  return {
    id: live.liveId,
    href: `/live/${encodeURIComponent(live.liveId)}?mode=replay`,
    title: realLiveTitle(live),
    date: live.actualStartAt ? formatClipDate(live.actualStartAt) : null,
    image: live.thumbnailUrl,
  };
}

/** 쇼츠 화면(#317)으로 바로 간다. 제목이 없으면 쇼츠 화면과 같이 "숏 클립"이라 적는다. */
export function clipVideo(clip: ProjectClip): VideoCard {
  return {
    id: clip.highlightId,
    href: `/live/${encodeURIComponent(clip.liveId)}?mode=replay&view=clip&clip=${encodeURIComponent(clip.highlightId)}`,
    title: clip.title?.trim() || "숏 클립",
    date: formatClipDate(clip.createdAt),
    image: clip.thumbnailUrl,
    video: clip.clipUrl,
    badge: clipBadge(clip.sceneLabel),
  };
}
