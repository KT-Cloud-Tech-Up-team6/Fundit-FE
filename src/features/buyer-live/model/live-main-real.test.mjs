import assert from "node:assert/strict";
import test from "node:test";
import {
  DEMO_RANK,
  FOLLOW_FILTER_LIMIT,
  RANKING_ROWS,
  fillRankingSlots,
  fillRealSlots,
  followSellerIds,
  pickDemoLive,
  pickNewOpen,
  pickUpcoming,
  realLiveHref,
  realLiveSeller,
  realLiveTitle,
  scheduleLabel,
  upcomingTitleDate,
  withViewerCounts,
} from "./live-main-real.ts";

const live = (overrides = {}) => ({
  liveId: "0199c3a0-0000-7000-8000-000000000001",
  introText: "소개",
  status: "LIVE",
  projectId: "0199c3a0-1111-7000-8000-000000000001",
  thumbnailUrl: null,
  scheduledStartAt: null,
  likeCount: 0,
  createdAt: "2026-09-24T00:00:00Z",
  ...overrides,
});

test("모든 칸을 실제 LIVE로 앞에서부터 API 순서대로 채우고 모자라는 뒤쪽 칸만 목업으로 둔다", () => {
  assert.deepEqual(fillRealSlots(4, ["a", "b"]), ["a", "b", undefined, undefined]);
  // 실제 LIVE가 없으면 전부 목업이다.
  assert.deepEqual(fillRealSlots(5, []), [undefined, undefined, undefined, undefined, undefined]);
  // 실제 LIVE가 칸보다 많으면 칸 수만큼만 쓴다.
  assert.deepEqual(fillRealSlots(2, ["a", "b", "c"]), ["a", "b"]);
  assert.deepEqual(fillRealSlots(3, ["a", "b", "c"]), ["a", "b", "c"]);
});

test("실시간 순위는 시연 칸(4위)을 비워 두고 나머지 칸을 실제 LIVE로 채운다", () => {
  const lives = Array.from({ length: 12 }, (_, index) =>
    live({ liveId: `l${index + 1}`, projectId: `p${index + 1}` }),
  );
  const slots = fillRankingSlots(lives);
  assert.equal(slots.length, RANKING_ROWS);
  assert.equal(slots[DEMO_RANK - 1], undefined);
  assert.deepEqual(
    slots.map((slot) => slot?.liveId),
    ["l1", "l2", "l3", undefined, "l4", "l5", "l6", "l7", "l8", "l9"],
  );
  // 실제 LIVE가 모자라면 뒤쪽 칸은 목업이고, 시연 칸은 늘 4위다.
  assert.deepEqual(
    fillRankingSlots(lives.slice(0, 2)).map((slot) => slot?.liveId),
    [
      "l1",
      "l2",
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ],
  );
});

test("시연 칸이 가리키는 LIVE는 순위에 섞여 와도 다른 칸에 두 번 보이지 않는다", () => {
  const lives = [live({ liveId: "a" }), live({ liveId: "demo" }), live({ liveId: "b" })];
  assert.deepEqual(
    fillRankingSlots(lives, "demo")
      .map((slot) => slot?.liveId)
      .slice(0, 3),
    ["a", "b", undefined],
  );
});

test("시연 칸은 최신순 목록에서 가장 최근에 만든 방송 중 LIVE로 간다", () => {
  const newest = live({ liveId: "newest" });
  // 최신순 목록의 앞쪽에 예정·종료 LIVE가 있어도 방송 중인 첫 LIVE를 고른다.
  assert.equal(
    pickDemoLive([
      live({ liveId: "draft-like", status: "SCHEDULED" }),
      newest,
      live({ liveId: "older" }),
    ]),
    newest,
  );
  // 방송 중인 LIVE가 없으면 목업 화면으로 간다.
  assert.equal(pickDemoLive([live({ status: "ENDED" }), live({ status: "SCHEDULED" })]), undefined);
  assert.equal(pickDemoLive([]), undefined);
});

test("신규 오픈은 방송 중·예정만, 날짜별 예정은 지금 이후를 이른 순서로 고른다", () => {
  const items = [
    live({ liveId: "ended", status: "ENDED" }),
    live({ liveId: "error", status: "ERROR" }),
    live({ liveId: "scheduled", status: "SCHEDULED" }),
    live({ liveId: "live", status: "LIVE" }),
  ];
  assert.deepEqual(
    pickNewOpen(items).map((item) => item.liveId),
    ["scheduled", "live"],
  );

  const now = Date.parse("2026-09-24T03:00:00Z");
  const upcoming = [
    live({ liveId: "late", status: "SCHEDULED", scheduledStartAt: "2026-09-30T03:00:00Z" }),
    live({ liveId: "past", status: "SCHEDULED", scheduledStartAt: "2026-09-24T02:59:00Z" }),
    live({ liveId: "soon", status: "SCHEDULED", scheduledStartAt: "2026-09-25T03:00:00Z" }),
    live({ liveId: "no-date", status: "SCHEDULED", scheduledStartAt: null }),
    live({ liveId: "live", status: "LIVE", scheduledStartAt: "2026-09-25T00:00:00Z" }),
  ];
  assert.deepEqual(
    pickUpcoming(upcoming, now).map((item) => item.liveId),
    ["soon", "late"],
  );
});

test("방송 중이면 시청 화면, 예정이면 그 프로젝트 상세로 간다", () => {
  assert.equal(realLiveHref(live()), "/live/0199c3a0-0000-7000-8000-000000000001");
  assert.equal(
    realLiveHref(live({ status: "SCHEDULED" })),
    "/projects/0199c3a0-1111-7000-8000-000000000001?tab=story",
  );
});

test("제목은 소개 문구이고 비어 있으면 비어 있다고 적는다", () => {
  assert.equal(realLiveTitle(live({ introText: "  무선청소기 특가  " })), "무선청소기 특가");
  assert.equal(realLiveTitle(live({ introText: null })), "소개 문구 없음");
  assert.equal(realLiveTitle(live({ introText: "   " })), "소개 문구 없음");
});

test("예정 시각은 한국 시간의 월.일과 오전·오후 시각으로 적는다", () => {
  assert.deepEqual(scheduleLabel("2026-09-18T06:40:00Z"), { date: "09.18", time: "오후 3:40" });
  assert.deepEqual(scheduleLabel("2026-09-30T15:05:00Z"), { date: "10.01", time: "오전 12:05" });
  assert.deepEqual(scheduleLabel(null), { date: "", time: "" });
  assert.deepEqual(scheduleLabel("not-a-date"), { date: "", time: "" });
});

test("팔로우 필터는 목록 앞에서 정해진 수만 보낸다", () => {
  const follows = Array.from({ length: FOLLOW_FILTER_LIMIT + 5 }, (_, index) => ({
    sellerId: `seller-${index}`,
    sellerName: "",
    sellerNickname: "",
    createdAt: "",
  }));
  const ids = followSellerIds(follows);
  assert.equal(ids.length, FOLLOW_FILTER_LIMIT);
  assert.equal(ids[0], "seller-0");
  assert.deepEqual(followSellerIds([]), []);
});

test("신규 오픈 LIVE는 함께 받은 실시간 순위에 있으면 그 시청자 수를 붙이고, 없으면 그대로 둔다", () => {
  const newOpen = [
    live({ liveId: "a" }),
    live({ liveId: "b" }),
    live({ liveId: "s", status: "SCHEDULED" }),
  ];
  const ranking = [live({ liveId: "b", viewerCount: 1234 }), live({ liveId: "c", viewerCount: 9 })];
  const result = withViewerCounts(newOpen, ranking);
  assert.equal(result[0].viewerCount, undefined);
  assert.equal(result[1].viewerCount, 1234);
  assert.equal(result[2].viewerCount, undefined);
  // 원래 목록은 바꾸지 않는다.
  assert.equal(newOpen[1].viewerCount, undefined);
  // 시청자 수 0도 수로 붙인다.
  assert.equal(
    withViewerCounts([live({ liveId: "z" })], [live({ liveId: "z", viewerCount: 0 })])[0]
      .viewerCount,
    0,
  );
  assert.deepEqual(withViewerCounts(newOpen, []), newOpen);
});

test("실제 LIVE 카드의 판매자 줄은 닉네임이 있을 때만 그린다", () => {
  assert.equal(realLiveSeller(live()), undefined);
  assert.equal(realLiveSeller(live({ sellerNickname: null })), undefined);
  assert.equal(realLiveSeller(live({ sellerNickname: "  " })), undefined);
  assert.equal(realLiveSeller(live({ sellerNickname: " 뷰티마켓 " })), "뷰티마켓");
});

test("날짜별 예정 제목은 탭을 연 날의 한국 날짜와 요일이다", () => {
  // 한국 시간 9/29(화) 00:30 — UTC로는 전날이지만 한국 날짜를 쓴다.
  assert.equal(upcomingTitleDate(Date.parse("2026-09-28T15:30:00Z")), "9/29일 (화)");
  assert.equal(upcomingTitleDate(Date.parse("2026-09-08T03:00:00Z")), "9/8일 (화)");
  assert.equal(upcomingTitleDate(Date.parse("2026-10-04T14:59:59Z")), "10/4일 (일)");
});
