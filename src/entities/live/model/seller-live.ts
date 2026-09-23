import type {
  LivePage,
  LiveStatus,
  LiveStatusCounts,
  LiveSummaryResponse,
} from "../api/seller-live-api";

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
export const tabStatuses: Record<SellerLiveTab, readonly LiveStatus[]> = {
  active: ["LIVE"],
  draft: ["DRAFT", "SCHEDULED"],
  closed: ["ENDED"],
};

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

/** 응답 → 카드 목록. 상태는 서버가 걸러 주고, `content`가 빠진 응답에도 빈 목록을 돌려준다. */
export function toSellerLiveList(page: LivePage | undefined): SellerLive[] {
  return (page?.content ?? []).map(toSellerLive);
}

const countKeys: Record<LiveStatus, keyof LiveStatusCounts> = {
  DRAFT: "draft",
  SCHEDULED: "scheduled",
  LIVE: "live",
  ENDED: "ended",
  ERROR: "error",
};

/**
 * 탭에 붙일 건수. `GET /lives/status-counts`의 상태별 건수를 탭 매핑대로 더한다 —
 * 준비중은 `draft + scheduled`다. ERROR는 어느 탭에도 속하지 않아 어디에도 더하지 않는다.
 */
export function tabCount(tab: SellerLiveTab, counts: LiveStatusCounts | undefined): number | null {
  if (!counts) return null;
  return tabStatuses[tab].reduce((sum, status) => sum + (counts[countKeys[status]] ?? 0), 0);
}
