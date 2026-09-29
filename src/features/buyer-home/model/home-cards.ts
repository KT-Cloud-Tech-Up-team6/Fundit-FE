/* 홈(#367)의 실제 API 섹션 카드 값. "지금 주목받는 프로젝트"는 `GET /api/v1/home/feed`,
   "실시간 LIVE"는 `GET /api/v1/lives?status=LIVE&sort=viewerCount`에서 온다. BE에 없는 값은 채우지 않는다. */
import type { ProjectCardResponse } from "@/entities/project/api/buyer-project-api";
import type { LiveSummaryResponse } from "@/entities/live/api/seller-live-api";
import { isPublicUuid } from "@/shared/lib/public-uuid";
import {
  realLiveHref,
  realLiveSeller,
  realLiveTitle,
} from "@/features/buyer-live/model/live-main-real";

/** 실제 API 섹션의 표시 상태. 조회 중·실패·빈 목록에도 섹션은 남기고 안내를 보인다. */
export type SectionData<T> =
  | { status: "loading" }
  | { status: "error"; onRetry: () => void }
  | { status: "ready"; items: readonly T[] };

export type FeaturedCard = {
  id: string;
  /** 상세 경로. 공개 UUID가 없으면 비워 카드를 링크로 만들지 않는다. */
  href?: string;
  title: string;
  image?: string | null;
  /** PC 카드 위쪽의 대분류. */
  category?: string;
  seller?: string;
  /** 달성률 문구. 프로젝트 상세를 받기 전·실패하면 비운다. */
  achievement?: string;
};

/**
 * 홈 피드 달성률은 검색 색인 값이라 BE 명세상 펀딩 집계 이벤트(SEARCH-013) 전까지 0이다. 그래서 행의
 * `achievementRate` 대신 프로젝트 상세의 달성률(`achievementRate`)을 받아 쓴다(#445).
 */
export function featuredCard(row: ProjectCardResponse, achievementRate?: number): FeaturedCard {
  return {
    id: String(row.projectId),
    /* 상세 API의 경로 변수는 공개 UUID다. 숫자 projectId를 넣으면 안 된다(BE SearchDomainApiSpec). */
    href: isPublicUuid(row.projectPublicId) ? `/projects/${row.projectPublicId}` : undefined,
    title: row.title,
    image: row.thumbnailUrl,
    category: row.categoryMajor,
    seller: row.sellerDisplayName,
    achievement:
      achievementRate === undefined
        ? undefined
        : `${achievementRate.toLocaleString("ko-KR")}% 달성`,
  };
}

export type LiveCard = {
  id: string;
  href: string;
  title: string;
  image?: string | null;
  /** 시청자 수. 모르면 뱃지를 그리지 않는다. */
  viewers?: string;
  seller?: string;
};

export function liveCard(live: LiveSummaryResponse): LiveCard {
  return {
    id: live.liveId,
    href: realLiveHref(live),
    title: realLiveTitle(live),
    image: live.thumbnailUrl,
    viewers: live.viewerCount?.toLocaleString("ko-KR"),
    seller: realLiveSeller(live),
  };
}
