import assert from "node:assert/strict";
import test from "node:test";
import {
  achievementRate,
  demoRewardRows,
  formatPeople,
  formatPeriod,
  formatQuantity,
  formatWon,
} from "./funding-demo.ts";

test("달성률은 반올림하고 목표가 0이면 0이다", () => {
  assert.equal(achievementRate(6_400_000, 5_000_000), 128);
  assert.equal(achievementRate(5_000_000, 5_000_000), 100);
  assert.equal(achievementRate(1, 3), 33);
  assert.equal(achievementRate(1_000_000, 0), 0);
});

test("금액·인원·수량은 천 단위 구분과 단위를 붙인다", () => {
  assert.equal(formatWon(5_000_000), "5,000,000원");
  assert.equal(formatPeople(132), "132명");
  assert.equal(formatQuantity(100), "100개");
  assert.equal(formatQuantity(1_500), "1,500개");
});

test("펀딩 기간은 점 구분으로 잇고 형식이 다르면 원문을 유지한다", () => {
  assert.equal(formatPeriod({ start: "2026-07-01", end: "2026-08-12" }), "2026.07.01 - 2026.08.12");
  assert.equal(formatPeriod({ start: "미정", end: "2026-08-12" }), "미정 - 2026.08.12");
});

test("목업 리워드 행은 고유 id를 가진다", () => {
  const ids = demoRewardRows().map((row) => row.id);
  assert.equal(new Set(ids).size, ids.length);
});
