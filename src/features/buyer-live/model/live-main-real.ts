/* LIVE 메인(#345)에 실제 LIVE를 섞는 순수 헬퍼. PM 방식(2026-09-24): 섹션의 일부 칸만 실제 LIVE로
   채우고 나머지는 목업으로 둔다. 실제 카드는 BE에 없는 판매자·카테고리·달성률을 채우지 않는다. */
import type { LiveSummaryResponse } from "@/entities/live/api/seller-live-api";
import type { FollowedSeller } from "@/entities/seller/api/follow-api";

/** 섹션마다 실제 LIVE로 바꾸는 칸 수. 검수에서 조정할 수 있게 한곳에 둔다. */
export const REAL_LIVE_SLOTS = 1;

/** 팔로우 목록 앞에서 이만큼만 `sellerId`로 보낸다. UUID가 한 명당 37자라 주소가 너무 길어지지 않게 한다. */
export const FOLLOW_FILTER_LIMIT = 100;

/** 섹션별 실제 LIVE 후보. 앞에서부터 칸을 채운다. */
export type RealLives = {
  newOpen: readonly LiveSummaryResponse[];
  ranking: readonly LiveSummaryResponse[];
  /** 실시간 탭은 방송 중, 예정 탭은 예정인 팔로우 판매자의 LIVE다. */
  following: readonly LiveSummaryResponse[];
  scheduled: readonly LiveSummaryResponse[];
};

export const noRealLives: RealLives = { newOpen: [], ranking: [], following: [], scheduled: [] };

/**
 * 칸 `count`개의 끝에서부터 `slots`칸을 실제 LIVE로 채운다. 실제 LIVE가 모자라면 남는 칸은 목업이다.
 * 결과에서 `undefined`인 자리가 목업 칸이다.
 */
export function fillRealSlots<T>(
  count: number,
  real: readonly T[],
  slots = REAL_LIVE_SLOTS,
): (T | undefined)[] {
  const start = count - Math.max(0, Math.min(slots, real.length, count));
  return Array.from({ length: count }, (_, index) =>
    index >= start ? real[index - start] : undefined,
  );
}

export const followSellerIds = (follows: readonly FollowedSeller[]) =>
  follows.slice(0, FOLLOW_FILTER_LIMIT).map((follow) => follow.sellerId);

/** 신규 오픈: 최신순 목록에서 지금 볼 수 있는 방송(진행 중·예정)만 남긴다. 종료·오류는 뺀다. */
export const pickNewOpen = (lives: readonly LiveSummaryResponse[]) =>
  lives.filter((live) => live.status === "LIVE" || live.status === "SCHEDULED");

/* 최신순 목록에는 시청자 수가 없다(BE가 순위 조회에서만 IVS에 묻는다). 같은 화면이 함께 받은 실시간 순위에
   같은 LIVE가 있으면 그 수를 붙인다. 순위 첫 페이지 밖의 LIVE는 수 없이 그대로 둔다. */
export function withViewerCounts(
  lives: readonly LiveSummaryResponse[],
  ranking: readonly LiveSummaryResponse[],
) {
  const viewers = new Map(
    ranking.flatMap((live) =>
      live.viewerCount === undefined ? [] : [[live.liveId, live.viewerCount] as const],
    ),
  );
  return lives.map((live) => {
    const viewerCount = viewers.get(live.liveId);
    return viewerCount === undefined ? live : { ...live, viewerCount };
  });
}

/** 날짜별 예정: 목록은 생성 최신순이라 지금 이후 시작하는 예정 LIVE를 이른 순서로 다시 줄 세운다. */
export function pickUpcoming(lives: readonly LiveSummaryResponse[], now: number) {
  return lives
    .flatMap((live) => {
      const startAt = live.scheduledStartAt ? Date.parse(live.scheduledStartAt) : NaN;
      return live.status === "SCHEDULED" && startAt > now ? [{ live, startAt }] : [];
    })
    .sort((a, b) => a.startAt - b.startAt)
    .map(({ live }) => live);
}

/* 방송 중이면 시청 화면으로 간다. 예정 LIVE는 재생 정보가 없어 목업 예정 카드(getUpcomingProjectHref)처럼
   그 프로젝트의 상세로 보낸다. */
export function realLiveHref(live: LiveSummaryResponse) {
  return live.status === "LIVE"
    ? `/live/${encodeURIComponent(live.liveId)}`
    : `/projects/${encodeURIComponent(live.projectId)}?tab=story`;
}

/** 계약에 제목이 없어 소개 문구를 쓴다. 비어 있으면 가짜 제목 대신 비어 있다고 적는다. */
export const realLiveTitle = (live: LiveSummaryResponse) =>
  live.introText?.trim() || "소개 문구 없음";

/** 예정 카드 딤의 날짜(`09.18`)·시간(`오후 3:40`). 한국 시간 기준이고 값이 없으면 비운다. */
export function scheduleLabel(value: string | null) {
  const date = value ? new Date(value) : undefined;
  if (!date || Number.isNaN(date.getTime())) return { date: "", time: "" };
  /* 오전·오후 표기는 런타임의 로캘 데이터에 따라 "PM"으로 나오기도 해 24시간 숫자로 받아 직접 붙인다. */
  const part = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Seoul",
      month: "2-digit",
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((item) => [item.type, item.value]),
  );
  const hour = Number(part.hour);
  return {
    date: `${part.month}.${part.day}`,
    time: `${hour < 12 ? "오전" : "오후"} ${hour % 12 || 12}:${part.minute}`,
  };
}
