import assert from "node:assert/strict";
import test from "node:test";
import {
  achievementRate,
  demoRewardRows,
  formatPeople,
  formatPeriod,
  formatQuantity,
  formatWon,
  getFundingDemo,
} from "./funding-demo.ts";
import { getSellerProject } from "../../../entities/project/model/seller-project-demo.ts";

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

test("프로젝트 목록과 펀딩 상세는 같은 금액과 프로젝트 정보를 사용한다", () => {
  const project = getSellerProject("vacuum-cleaner");
  const { summary, rewards } = getFundingDemo(project.id);
  assert.equal(summary.title, project.title);
  assert.equal(summary.thumbnail, project.thumbnail);
  assert.equal(summary.raisedAmount, project.currentAmount);
  assert.equal(summary.goalAmount, project.goalAmount);
  assert.equal(
    rewards.reduce((sum, reward) => sum + reward.amount, 0),
    summary.raisedAmount,
  );
});

test("다른 프로젝트에 청소기 상세 통계를 복제하지 않는다", () => {
  const { summary, rewards } = getFundingDemo("steam-sterilizer");
  assert.equal(summary.raisedAmount, 2_720_000);
  assert.equal(summary.wishlistCount, null);
  assert.equal(summary.openAlertCount, null);
  assert.deepEqual(rewards, []);
  assert.equal(getFundingDemo("unknown-project"), undefined);
  assert.equal(getFundingDemo("encore-pouch"), undefined);
});

test("종료 프로젝트는 금액과 관계없이 목록의 기존 상태 배지를 유지한다", () => {
  for (const id of ["minimal-keyboard", "daily-sunglasses", "woven-watch-band"]) {
    const project = getSellerProject(id);
    const { summary } = getFundingDemo(id);
    assert.equal(summary.dday, "종료");
    assert.deepEqual(summary.closedBadge, project.badges[0]);
  }
  const { summary } = getFundingDemo("minimal-keyboard");
  assert.ok(summary.raisedAmount > summary.goalAmount);
  assert.equal(summary.closedBadge.label, "펀딩 실패");
  assert.equal(getFundingDemo("vacuum-cleaner").summary.closedBadge, null);
  assert.equal(getFundingDemo("steam-sterilizer").summary.closedBadge, null);
});
