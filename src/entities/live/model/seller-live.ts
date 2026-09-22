import type { LivePage, LiveStatus, LiveSummaryResponse } from "../api/seller-live-api";

export const sellerLiveTabs = ["active", "draft", "closed"] as const;
export type SellerLiveTab = (typeof sellerLiveTabs)[number];

/** Badge의 state 중 이 카드가 쓰는 값만 추린다. */
export type SellerLiveBadgeVariant = "primaryLive" | "info" | "warning" | "neutral";

export type SellerLive = {
  id: string;
  status: LiveStatus;
  /** introText가 비어 있을 수 있다. 그때는 문구 대신 안내를 그리도록 비운 채로 둔다. */
  introText: string;
  thumbnail: string;
  statusLabel: string;
  statusVariant: SellerLiveBadgeVariant;
  scheduledStartAtLabel: string;
  createdAtLabel: string;
  likeCount: number;
  manageHref: string;
};

/* 탭 ↔ 상태 매핑(#283). ERROR는 어느 탭에도 넣지 않는다 — 판매자에게 진행중으로도
   완료로도 보이면 안 되는 상태고, 임의 분류는 화면이 사실과 다른 말을 하게 만든다. */
const tabStatuses: Record<SellerLiveTab, readonly LiveStatus[]> = {
  active: ["LIVE"],
  draft: ["DRAFT", "SCHEDULED"],
  closed: ["ENDED"],
};

/**
 * 서버에 보낼 `status`. 준비중 탭만 undefined다.
 *
 * `status`는 단일값이라 DRAFT·SCHEDULED를 한 번에 받을 수 없다. 둘 중 하나만 보내면
 * 나머지 LIVE에 도달할 길이 없어지므로 준비중 탭은 필터를 생략해 전체를 페이지 단위로
 * 받고 화면에서 두 상태만 그린다. 틀린 항목이 섞이지 않고 모든 항목에 도달할 수 있지만
 * **페이지당 표시 건수가 고르지 않다**(8건을 받아 2건만 준비중일 수 있다).
 * BE에 다중 상태 필터가 생기면 이 우회를 걷는다.
 */
export function tabStatusParam(tab: SellerLiveTab): LiveStatus | undefined {
  return tab === "draft" ? undefined : tabStatuses[tab][0];
}

export function isInTab(tab: SellerLiveTab, status: LiveStatus) {
  return tabStatuses[tab].includes(status);
}

const statusLabels: Record<LiveStatus, string> = {
  DRAFT: "임시저장",
  SCHEDULED: "방송 예정",
  LIVE: "LIVE",
  ENDED: "방송 종료",
  ERROR: "오류",
};

const statusVariants: Record<LiveStatus, SellerLiveBadgeVariant> = {
  DRAFT: "info",
  SCHEDULED: "info",
  LIVE: "primaryLive",
  ENDED: "neutral",
  ERROR: "warning",
};

/* 상태별로 판매자가 이어서 할 일이 달라 목적지가 갈린다. 실제로 존재하는 라우트에만 보낸다.
   - DRAFT·SCHEDULED → 큐시트. 방송 준비를 이어가는 화면이다(API 미연결이나 화면은 있다).
   - LIVE → 방송 콘솔. 송출 중 조작이 여기 있다.
   - ENDED → 방송 후 콘텐츠.
   ERROR는 목록에 실리지 않지만 상태가 5종이라 매핑을 비워 두지 않는다. 복구 지점이
   따로 없어 준비 화면인 큐시트로 둔다. */
const manageDestinations: Record<LiveStatus, (id: string) => string> = {
  DRAFT: (id) => `/seller/live/${id}/cue-sheet`,
  SCHEDULED: (id) => `/seller/live/${id}/cue-sheet`,
  LIVE: (id) => `/seller/live/${id}/console`,
  ENDED: (id) => `/seller/live/${id}/review`,
  ERROR: (id) => `/seller/live/${id}/cue-sheet`,
};

export function liveManageHref(status: LiveStatus, liveId: string) {
  return manageDestinations[status](encodeURIComponent(liveId));
}

function formatDate(value: string | null, withTime: boolean) {
  if (!value) return "미정";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "미정";
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    /* hourCycle h23 — 자정을 "24:00"으로 적는 ko-KR 기본 표기를 피한다. */
    ...(withTime ? { hour: "2-digit", minute: "2-digit", hourCycle: "h23" as const } : {}),
  }).format(date);
  return parts;
}

export function toSellerLive(item: LiveSummaryResponse): SellerLive {
  return {
    id: item.liveId,
    status: item.status,
    /* 제목 필드가 계약에 없다. introText가 유일한 문구인데 임시저장 LIVE는 이것도
       비어 있을 수 있다. 그때는 가짜 제목을 만들지 않고 빈 문자열로 넘겨
       카드가 "소개 문구 없음" 안내를 그리게 한다. */
    introText: item.introText?.trim() ?? "",
    thumbnail: item.thumbnailUrl ?? "",
    statusLabel: statusLabels[item.status] ?? item.status,
    statusVariant: statusVariants[item.status] ?? "neutral",
    scheduledStartAtLabel: formatDate(item.scheduledStartAt, true),
    createdAtLabel: formatDate(item.createdAt, false),
    likeCount: item.likeCount ?? 0,
    manageHref: liveManageHref(item.status, item.liveId),
  };
}

/**
 * 응답 → 카드 목록. `content`가 빠진 응답에도 빈 목록을 돌려주고,
 * 탭에 속하지 않는 상태는 걸러낸다(준비중 탭의 전체 조회가 여기서 좁혀진다).
 */
export function toSellerLiveList(page: LivePage | undefined, tab: SellerLiveTab): SellerLive[] {
  return (page?.content ?? []).filter((item) => isInTab(tab, item.status)).map(toSellerLive);
}

/**
 * 탭에 붙일 건수.
 *
 * 프로젝트 목록과 달리 LIVE에는 상태별 건수 API가 없다. 없는 API를 지어내지 않는다.
 * 서버가 상태로 걸러 준 탭(진행중·완료)만 그 탭을 보고 있을 때 `totalElements`로 채우고
 * 나머지는 비운다. 준비중 탭은 전체를 받아 화면에서 거르므로 `totalElements`가
 * 준비중 건수가 아니다 — 그래서 선택돼 있어도 비운다.
 */
export function tabCount(
  tab: SellerLiveTab,
  selectedTab: SellerLiveTab,
  page: LivePage | undefined,
): number | null {
  if (tab !== selectedTab || tab === "draft" || !page) return null;
  return page.totalElements ?? null;
}
