import assert from "node:assert/strict";
import test from "node:test";
import {
  isInTab,
  liveManageHref,
  tabCount,
  tabStatusParam,
  toSellerLive,
  toSellerLiveList,
} from "./seller-live";
import type { LivePage, LiveStatus, LiveSummaryResponse } from "../api/seller-live-api";

const live = (overrides: Partial<LiveSummaryResponse> = {}): LiveSummaryResponse => ({
  liveId: "0199c3a0-1b2c-7a3b-8c4d-5e6f7a8b9c0d",
  introText: "무선청소기 라이브",
  status: "LIVE",
  projectId: "0199c3a0-1b2c-7a3b-8c4d-5e6f7a8b9c0e",
  thumbnailUrl: null,
  scheduledStartAt: "2026-07-01T05:00:00Z",
  likeCount: 12,
  createdAt: "2026-06-20T01:00:00Z",
  ...overrides,
});

const page = (overrides: Partial<LivePage> = {}): LivePage => ({
  content: [],
  page: 0,
  size: 8,
  totalElements: 0,
  totalPages: 1,
  hasNext: false,
  ...overrides,
});

test("준비중 탭만 status를 생략한다", () => {
  assert.equal(tabStatusParam("active"), "LIVE");
  assert.equal(tabStatusParam("closed"), "ENDED");
  /* DRAFT·SCHEDULED를 한 번에 받을 수 없어 전체를 받고 화면에서 거른다. */
  assert.equal(tabStatusParam("draft"), undefined);
});

test("준비중 탭은 DRAFT·SCHEDULED만 받고 ERROR는 어느 탭에도 없다", () => {
  assert.equal(isInTab("draft", "DRAFT"), true);
  assert.equal(isInTab("draft", "SCHEDULED"), true);
  assert.equal(isInTab("draft", "LIVE"), false);
  assert.equal(isInTab("draft", "ENDED"), false);
  for (const tab of ["active", "draft", "closed"] as const) {
    assert.equal(isInTab(tab, "ERROR"), false);
  }
});

test("전체 조회 응답에서 준비중 탭이 DRAFT·SCHEDULED만 남긴다", () => {
  const statuses: LiveStatus[] = ["DRAFT", "SCHEDULED", "LIVE", "ENDED", "ERROR"];
  const items = toSellerLiveList(
    page({ content: statuses.map((status, index) => live({ status, liveId: `id-${index}` })) }),
    "draft",
  );
  assert.deepEqual(
    items.map((item) => item.status),
    ["DRAFT", "SCHEDULED"],
  );
});

test("content가 빠진 응답에도 빈 목록을 돌려준다", () => {
  /* #279와 같은 형태다 — 응답은 왔는데 배열 필드가 없으면 렌더 도중 터진다. */
  assert.deepEqual(toSellerLiveList(undefined, "active"), []);
  assert.deepEqual(
    toSellerLiveList({ ...page(), content: undefined } as unknown as LivePage, "active"),
    [],
  );
});

test("소개 문구가 없으면 지어내지 않고 빈 문자열로 넘긴다", () => {
  assert.equal(toSellerLive(live({ introText: null })).introText, "");
  assert.equal(toSellerLive(live({ introText: "   " })).introText, "");
  assert.equal(toSellerLive(live({ introText: " 라이브 " })).introText, "라이브");
});

test("일시는 KST로 적고 값이 없으면 미정이다", () => {
  const item = toSellerLive(live());
  assert.equal(item.scheduledStartAtLabel, "2026. 07. 01. 14:00");
  assert.equal(item.createdAtLabel, "2026. 06. 20.");
  assert.equal(toSellerLive(live({ scheduledStartAt: null })).scheduledStartAtLabel, "미정");
  assert.equal(
    toSellerLive(live({ scheduledStartAt: "not-a-date" })).scheduledStartAtLabel,
    "미정",
  );
});

test("상태 뱃지 라벨과 변형", () => {
  assert.deepEqual(
    (["DRAFT", "SCHEDULED", "LIVE", "ENDED", "ERROR"] as LiveStatus[]).map((status) => {
      const item = toSellerLive(live({ status }));
      return [item.statusLabel, item.statusVariant];
    }),
    [
      ["임시저장", "info"],
      ["방송 예정", "info"],
      ["LIVE", "primaryLive"],
      ["방송 종료", "neutral"],
      ["오류", "warning"],
    ],
  );
});

test("관리 버튼은 실제로 있는 화면으로만 간다", () => {
  const id = "0199c3a0-1b2c-7a3b-8c4d-5e6f7a8b9c0d";
  assert.equal(liveManageHref("DRAFT", id), `/seller/live/${id}/cue-sheet`);
  assert.equal(liveManageHref("SCHEDULED", id), `/seller/live/${id}/cue-sheet`);
  assert.equal(liveManageHref("LIVE", id), `/seller/live/${id}/console`);
  assert.equal(liveManageHref("ENDED", id), `/seller/live/${id}/review`);
  assert.equal(liveManageHref("ERROR", id), `/seller/live/${id}/cue-sheet`);
});

test("경로에 들어가는 liveId는 이스케이프한다", () => {
  assert.equal(liveManageHref("LIVE", "a/../admin"), "/seller/live/a%2F..%2Fadmin/console");
});

test("건수는 서버가 걸러 준 탭에서 보고 있을 때만 채운다", () => {
  const data = page({ totalElements: 17 });
  assert.equal(tabCount("active", "active", data), 17);
  assert.equal(tabCount("closed", "closed", data), 17);
  /* 준비중은 전체를 받아 화면에서 거르므로 totalElements가 준비중 건수가 아니다. */
  assert.equal(tabCount("draft", "draft", data), null);
  /* 보고 있지 않은 탭은 부를 API가 없다. */
  assert.equal(tabCount("closed", "active", data), null);
  assert.equal(tabCount("active", "active", undefined), null);
});
