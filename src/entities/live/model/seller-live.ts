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

/* 탭 ↔ 상태 매핑(#283). 시작에 실패한 ERROR는 다시 시작할 방송이라 준비중 탭에 "시작 실패"로
   둔다(요청서 PM-9 회신, #400). 서버는 ERROR에서 설정 저장·시작을 모두 받는다. */
export const tabStatuses: Record<SellerLiveTab, readonly LiveStatus[]> = {
  active: ["LIVE"],
  draft: ["DRAFT", "SCHEDULED", "ERROR"],
  closed: ["ENDED"],
};

const statusLabels: Record<LiveStatus, string> = {
  DRAFT: "임시저장",
  SCHEDULED: "방송 예정",
  LIVE: "LIVE",
  ENDED: "방송 종료",
  ERROR: "시작 실패",
};

const statusVariants: Record<LiveStatus, SellerLiveBadgeVariant> = {
  DRAFT: "info",
  SCHEDULED: "info",
  LIVE: "primaryLive",
  ENDED: "neutral",
  ERROR: "warning",
};

/* 상태별로 판매자가 이어서 할 일이 달라 목적지가 갈린다. 실제로 존재하는 라우트에만 보낸다.
   - DRAFT → 큐시트. 방송 준비를 이어가는 화면이다(API 미연결이나 화면은 있다).
   - SCHEDULED → 그 프로젝트의 LIVE 생성(`FL_S_LV_CREATE`)에 이 LIVE를 불러와 고친다. IA 판매자 18행
     "예정 중인 프로젝트 클릭 시 기존 설정값 로드, 수정 모드로 [FL_S_LV_CREATE] 이동"이다(#444).
     예약을 해제하거나 바꾸는 곳이 이 화면뿐이다.
   - LIVE → 방송 콘솔. 송출 중 조작이 여기 있다.
   - ENDED → LIVE 체크 작성(`FL_S_LV_VERIFY`, IA 판매자 18행). 원본의 이 모달은 콘솔 위에 있어
     콘솔을 열면서 모달을 띄운다(#399).
   - ERROR → 예약 LIVE와 같은 화면에 불러와 다시 시작한다(#400). LIVE 시작 버튼이 이 화면에만 있다. */
const resumeInCreate = (id: string, projectId: string) =>
  `/seller/projects/${projectId}/live/new?liveId=${id}`;
const manageDestinations: Record<LiveStatus, (id: string, projectId: string) => string> = {
  DRAFT: (id) => `/seller/live/${id}/cue-sheet`,
  SCHEDULED: resumeInCreate,
  LIVE: (id) => `/seller/live/${id}/console`,
  ENDED: (id) => `/seller/live/${id}/console?check=open`,
  ERROR: resumeInCreate,
};

export function liveManageHref(status: LiveStatus, liveId: string, projectId: string) {
  return manageDestinations[status](encodeURIComponent(liveId), encodeURIComponent(projectId));
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
    manageHref: liveManageHref(item.status, item.liveId, item.projectId),
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
 * 준비중은 `draft + scheduled + error`다.
 */
export function tabCount(tab: SellerLiveTab, counts: LiveStatusCounts | undefined): number | null {
  if (!counts) return null;
  return tabStatuses[tab].reduce((sum, status) => sum + (counts[countKeys[status]] ?? 0), 0);
}
