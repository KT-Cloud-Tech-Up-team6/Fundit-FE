/* 제작·배송 진행 관리(FL_S_DL_MNG)의 화면 상태와 순수 헬퍼.
   ponytail: 서버 계약이 없어(docs/OPEN_DECISIONS.md P1) 저장은 useState 목업으로만 둔다.
   API가 생기면 이 파일의 타입을 응답 스키마에 맞추고 헬퍼는 그대로 재사용한다. */

export const fulfillmentStages = [
  { value: "prep", label: "제작 착수" },
  { value: "production", label: "생산" },
  { value: "inspection", label: "검수" },
  { value: "release", label: "출고" },
  { value: "delivery", label: "배송" },
] as const;

export type FulfillmentStage = (typeof fulfillmentStages)[number]["value"];

/** Figma "진행 상태 표시"(488:7244) 3상태. */
export type StageStatus = "todo" | "active" | "done";

export const stageStatusLabel: Record<StageStatus, string> = {
  todo: "진행 전",
  active: "진행 중",
  done: "진행 완료",
};

export type MediaKind = "image" | "video";

export type MediaItem = {
  id: string;
  kind: MediaKind;
  name: string;
  /** objectURL. 업로드 서버가 없어 브라우저 밖에서는 null이다. */
  url: string | null;
};

export type FulfillmentRecord = {
  id: string;
  /** `yyyy-mm-dd`. 네이티브 <input type="date"> 값과 같은 형식. */
  date: string;
  text: string;
  media: MediaItem[];
  /** 구매자 화면(FL_B_MY_DLVR)의 `지연` 표기용. 판매자 화면은 이 값을 읽지 않는다. */
  delayed?: boolean;
};

export type StageState = {
  status: StageStatus;
  records: FulfillmentRecord[];
  /** 구매자 화면의 단계 기간 표기용(`yyyy-mm-dd`). 판매자 화면은 읽지 않아 optional로 둔다. */
  startDate?: string;
  expectedEndDate?: string;
};

export type FulfillmentState = Record<FulfillmentStage, StageState>;

/**
 * 구매자 제작·배송 현황(FL_B_MY_DLVR)용 래퍼. 판매자 `FulfillmentState`는 그대로 두고
 * 전체 예상 발송일만 덧붙인다.
 */
export type BuyerFulfillmentState = {
  stages: FulfillmentState;
  /** 전체 예상 발송일(`yyyy-mm-dd`). */
  expectedShippingDate?: string;
};

export const maxImages = 10;
export const maxVideos = 1;

/* ponytail: 지연 사유는 Figma 드롭다운(488:8277)에 그려진 4개만 그대로 쓴다.
   기획 확정 전이라 값을 늘리거나 코드를 붙이지 않는다(Issue #43 협의 사항). */
export const delayReasons = ["착수 지연", "재고 부족", "검수 지연", "출고 지연"] as const;

export type DelayReason = (typeof delayReasons)[number];

/* ponytail: 정체 경고 기준일. 기획 확정값이 없어 7일로 둔다.
   확정되면 이 상수만 바꾼다. */
export const staleAfterDays = 7;

export function stageLabel(stage: FulfillmentStage): string {
  return fulfillmentStages.find((item) => item.value === stage)!.label;
}

/** `yyyy-mm-dd` → `00월 00일`. 형식이 다르면 원문을 그대로 돌려준다. */
export function formatRecordDate(date: string): string {
  const match = /^\d{4}-(\d{2})-(\d{2})$/.exec(date);
  return match ? `${match[1]}월 ${match[2]}일` : date;
}

/**
 * `yyyy-mm-dd` → `yyyy.mm.dd`. 형식이 다르면 원문을 그대로 돌려준다.
 * Figma 프레임의 날짜 표기(`2026.09.10`)가 혼재해 화면 전체에서 이 하나로 통일한다.
 */
export function formatShippingDate(date: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  return match ? `${match[1]}.${match[2]}.${match[3]}` : date;
}

/** 기록을 날짜 내림차순(최신순)으로 정렬한 새 배열. 같은 날짜는 원래 순서를 유지하고 원본은 건드리지 않는다. */
export function sortRecordsByDateDesc(records: FulfillmentRecord[]): FulfillmentRecord[] {
  return records
    .map((record, index) => ({ record, index }))
    .sort((a, b) =>
      a.record.date === b.record.date ? a.index - b.index : a.record.date < b.record.date ? 1 : -1,
    )
    .map((entry) => entry.record);
}

/** 가장 최신 기록의 id. `업데이트` 뱃지 판별용. 기록이 없으면 null. */
export function latestRecordId(records: FulfillmentRecord[]): string | null {
  const [latest] = sortRecordsByDateDesc(records);
  return latest ? latest.id : null;
}

/** 로컬 기준 오늘의 `yyyy-mm-dd`. <input type="date">의 기본값으로 쓴다. */
export function todayValue(now: Date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * 단계 완료 전이. 진행 중(active)인 단계만 완료할 수 있고, 다음 단계가 이미 완료됐으면
 * 그 상태를 덮어쓰지 않는다 — 뒤 단계를 먼저 완료해도 앞 단계가 되돌아가지 않는다.
 * 완료할 수 없는 호출은 상태를 그대로(같은 참조로) 돌려준다.
 */
export function completeStage(state: FulfillmentState, stage: FulfillmentStage): FulfillmentState {
  if (state[stage].status !== "active") return state;
  const stages = fulfillmentStages.map((item) => item.value);
  const next = stages[stages.indexOf(stage) + 1];

  return {
    ...state,
    [stage]: { ...state[stage], status: "done" },
    ...(next && state[next].status !== "done"
      ? { [next]: { ...state[next], status: "active" as const } }
      : null),
  };
}

/** 진입 시 선택할 단계 — 진행 중 → 없으면 첫 미완료 → 전부 완료면 마지막(interaction_spec 528:11275). */
export function initialStage(state: FulfillmentState): FulfillmentStage {
  const stages = fulfillmentStages.map((item) => item.value);
  return (
    stages.find((stage) => state[stage].status === "active") ??
    stages.find((stage) => state[stage].status !== "done") ??
    stages[stages.length - 1]
  );
}

/** 등록 버튼 활성 조건 — 내용이 비어 있으면 비활성(interaction_spec 528:11275). */
export function canSubmit(text: string): boolean {
  return text.trim().length > 0;
}

/** 마지막 기록 이후 경과일. 기록이 없으면 null. */
export function daysSinceLastRecord(records: FulfillmentRecord[], today: string): number | null {
  const latest = records.reduce<string | null>(
    (max, record) => (max === null || record.date > max ? record.date : max),
    null,
  );
  if (latest === null) return null;
  const day = 24 * 60 * 60 * 1000;
  const elapsed = Date.parse(`${today}T00:00:00Z`) - Date.parse(`${latest}T00:00:00Z`);
  return Number.isNaN(elapsed) ? null : Math.max(0, Math.floor(elapsed / day));
}

/** 정체 경고 배너 노출 여부. 기록이 없거나 완료된 단계는 경고하지 않는다. */
export function isStale(stage: StageState, today: string, threshold = staleAfterDays): boolean {
  if (stage.status === "done") return false;
  const elapsed = daysSinceLastRecord(stage.records, today);
  return elapsed !== null && elapsed >= threshold;
}

export function mediaCounts(media: MediaItem[]): { image: number; video: number } {
  return {
    image: media.filter((item) => item.kind === "image").length,
    video: media.filter((item) => item.kind === "video").length,
  };
}

/** MIME 타입 → 첨부 종류. 사진·동영상이 아니면 null. */
export function mediaKindOf(type: string): MediaKind | null {
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  return null;
}

/**
 * 첨부 한도(사진 10 / 동영상 1)를 넘지 않는 범위까지만 받아들인다.
 * 넘친 항목은 `rejected`로 돌려줘 호출부가 aria-live로 알릴 수 있게 한다.
 */
export function addMedia(
  current: MediaItem[],
  incoming: MediaItem[],
): { media: MediaItem[]; rejected: MediaItem[] } {
  const accepted: MediaItem[] = [];
  const rejected: MediaItem[] = [];
  const limit = { image: maxImages, video: maxVideos };
  const counts = mediaCounts(current);

  for (const item of incoming) {
    if (counts[item.kind] < limit[item.kind]) {
      counts[item.kind] += 1;
      accepted.push(item);
    } else {
      rejected.push(item);
    }
  }
  return { media: accepted.length ? [...current, ...accepted] : current, rejected };
}

export function removeMedia(media: MediaItem[], id: string): MediaItem[] {
  return media.filter((item) => item.id !== id);
}

/** `yyyy-mm-dd`에서 며칠 뺀 날짜. 목업 기록을 오늘 기준으로 만들 때만 쓴다. */
function daysBefore(date: string, days: number): string {
  const shifted = new Date(`${date}T00:00:00Z`);
  shifted.setUTCDate(shifted.getUTCDate() - days);
  return shifted.toISOString().slice(0, 10);
}

/**
 * 목업 상태. 진행 중 단계는 `제작 착수`이고 앞선 단계는 없다(Figma 기본 화면).
 * 기록 날짜는 오늘 기준 상대값이라 시간이 지나도 기본 화면이 정체 경고 상태로 굳지 않는다.
 */
export function demoFulfillmentState(today: string = todayValue()): FulfillmentState {
  return {
    prep: {
      status: "active",
      records: [
        {
          id: "prep-1",
          date: daysBefore(today, 10),
          text: "샘플 검토를 마치고 초도 물량 발주를 넣었어요.",
          media: [
            { id: "prep-1-a", kind: "image", name: "sample-1.jpg", url: null },
            { id: "prep-1-b", kind: "image", name: "sample-2.jpg", url: null },
          ],
        },
        {
          id: "prep-2",
          date: daysBefore(today, 3),
          text: "부자재 입고가 끝나 다음 주부터 본생산에 들어갑니다.",
          media: [
            { id: "prep-2-a", kind: "image", name: "parts-1.jpg", url: null },
            { id: "prep-2-b", kind: "video", name: "line-check.mp4", url: null },
          ],
        },
      ],
    },
    production: { status: "todo", records: [] },
    inspection: { status: "todo", records: [] },
    release: { status: "todo", records: [] },
    delivery: { status: "todo", records: [] },
  };
}

/**
 * 구매자 목업 상태(FL_B_MY_DLVR). `제작 착수`는 완료, `생산`이 진행 중이고 뒤 단계는 대기다.
 * `생산` 기록은 최신순 정렬 전 임의 순서로 넣어 `sortRecordsByDateDesc`가 실제로 동작하는지 확인한다.
 * 날짜는 오늘 기준 상대값이라 시간이 지나도 화면이 굳지 않는다.
 */
export function demoBuyerFulfillmentState(today: string = todayValue()): BuyerFulfillmentState {
  const productionStart = daysBefore(today, 12);
  return {
    stages: {
      prep: {
        status: "done",
        startDate: daysBefore(today, 20),
        expectedEndDate: productionStart,
        records: [
          {
            id: "prep-1",
            date: daysBefore(today, 18),
            text: "샘플 검토를 마치고 초도 물량 발주를 넣었어요.",
            media: [],
          },
        ],
      },
      production: {
        status: "active",
        startDate: productionStart,
        expectedEndDate: daysBefore(today, -8),
        records: [
          {
            id: "production-2",
            date: daysBefore(today, 5),
            text: "생산 라인 가동을 시작했고 초도물량 품질 검사를 예정하고 있어요.",
            media: [],
          },
          {
            id: "production-1",
            date: daysBefore(today, 1),
            text: "도장·건조 라인을 통과한 1차 완성품이 나왔어요. 다음 주 포장 자재가 입고되면 최종 조립에 들어갑니다. 진행 사진을 함께 올려요.",
            media: [
              { id: "production-1-a", kind: "image", name: "line-1.jpg", url: null },
              { id: "production-1-b", kind: "image", name: "line-2.jpg", url: null },
            ],
          },
          {
            id: "production-4",
            date: productionStart,
            text: "생산 준비를 마치고 원자재 검수를 진행하고 있어요.",
            media: [
              { id: "production-4-a", kind: "image", name: "material-1.jpg", url: null },
              { id: "production-4-b", kind: "image", name: "material-2.jpg", url: null },
            ],
          },
          {
            id: "production-3",
            date: daysBefore(today, 3),
            text: "부자재 수급이 지연돼 생산 일정이 이틀 밀렸어요. 예상 완료일을 조정했습니다.",
            delayed: true,
            media: [],
          },
        ],
      },
      inspection: { status: "todo", records: [], startDate: daysBefore(today, -8) },
      release: { status: "todo", records: [], startDate: daysBefore(today, -14) },
      delivery: { status: "todo", records: [], startDate: daysBefore(today, -20) },
    },
    expectedShippingDate: daysBefore(today, -32),
  };
}
