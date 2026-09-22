import assert from "node:assert/strict";
import test from "node:test";
import {
  isEmptyLiveSettingsBody,
  LIVE_INTRO_MAX_LENGTH,
  toLiveSettingsBody,
  toScheduledStartAt,
} from "./live-settings";

test("날짜·시각 입력을 로컬 시각 그대로 ISO로 바꾼다", () => {
  const iso = toScheduledStartAt("2026-07-01", "13:05");
  assert.ok(iso);
  assert.equal(new Date(iso).getTime(), new Date("2026-07-01T13:05").getTime());
  assert.ok(iso.endsWith("Z"));
});

test("비었거나 해석되지 않는 예약 시각은 보내지 않는다", () => {
  assert.equal(toScheduledStartAt("", "13:05"), null);
  assert.equal(toScheduledStartAt("2026-07-01", ""), null);
  assert.equal(toScheduledStartAt("2026-13-45", "99:99"), null);
});

test("값이 없는 필드는 키 자체를 빼 부분 업데이트로 보낸다", () => {
  const body = toLiveSettingsBody({ introText: "  소개 문구  " });
  assert.deepEqual(body, { introText: "소개 문구" });
  assert.equal("category" in body, false);
  assert.equal("scheduledStartAt" in body, false);
});

test("대분류가 있을 때만 카테고리를 보낸다", () => {
  assert.deepEqual(toLiveSettingsBody({ categoryMajor: "테크·가전", categoryMinor: "청소기" }), {
    category: { major: "테크·가전", minor: "청소기" },
  });
  assert.deepEqual(toLiveSettingsBody({ categoryMajor: "테크·가전" }), {
    category: { major: "테크·가전", minor: null },
  });
  assert.deepEqual(toLiveSettingsBody({ categoryMinor: "청소기" }), {});
});

test("소개 문구는 BE 상한까지만 보낸다", () => {
  const body = toLiveSettingsBody({ introText: "가".repeat(LIVE_INTRO_MAX_LENGTH + 20) });
  assert.equal(body.introText?.length, LIVE_INTRO_MAX_LENGTH);
});

test("공백만 입력한 소개 문구는 저장하지 않는다", () => {
  assert.deepEqual(toLiveSettingsBody({ introText: "   " }), {});
  assert.equal(isEmptyLiveSettingsBody(toLiveSettingsBody({})), true);
  assert.equal(isEmptyLiveSettingsBody(toLiveSettingsBody({ introText: "a" })), false);
});
