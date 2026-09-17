import assert from "node:assert/strict";
import test from "node:test";
import {
  actionsForStatus,
  demoFundingDetail,
  demoFundingHistoryItems,
  filterFundingHistory,
  filterFundingHistoryByPeriod,
  formatDate,
  formatWon,
  getFundingPeriodStartDate,
} from "./funding-history.ts";

test("검색어는 제목 일부·대소문자 무시로 매칭한다", () => {
  const items = demoFundingHistoryItems();
  assert.equal(filterFundingHistory(items, "전기주전자", "all").length, 1);
  assert.equal(filterFundingHistory(items, "존재하지않음", "all").length, 0);
});

test("상태 필터는 all이면 전체, 아니면 해당 상태만 남긴다", () => {
  const items = demoFundingHistoryItems();
  assert.equal(filterFundingHistory(items, "", "shipping").length, 1);
  assert.deepEqual(
    filterFundingHistory(items, "", "shipping").map((item) => item.status),
    ["shipping"],
  );
});

test("기간 필터는 결제일과 기준일을 비교하고 직접 기간도 적용한다", () => {
  const items = demoFundingHistoryItems();
  assert.deepEqual(
    filterFundingHistoryByPeriod(items, "1m", { referenceDate: "2026-09-17" }).map(
      (item) => item.id,
    ),
    ["in_progress", "completed", "shipping", "delivered"],
  );
  assert.deepEqual(
    filterFundingHistoryByPeriod(items, "custom", {
      startDate: "2026-09-01",
      endDate: "2026-09-10",
    }).map((item) => item.id),
    ["completed"],
  );
});

test("기간 시작일은 시간대와 월말에 관계없이 날짜를 보존한다", () => {
  assert.equal(getFundingPeriodStartDate("1m", "2026-09-17"), "2026-08-17");
  assert.equal(getFundingPeriodStartDate("1m", "2026-03-31"), "2026-02-28");
  assert.equal(getFundingPeriodStartDate("1m", "2024-03-31"), "2024-02-29");

  const boundaryItem = { ...demoFundingHistoryItems()[0], id: "boundary", paidAt: "2026-08-16" };
  assert.deepEqual(
    filterFundingHistoryByPeriod([boundaryItem], "1m", { referenceDate: "2026-09-17" }),
    [],
  );
});

test("상태별 액션 버튼 구성은 Figma 카드와 같다", () => {
  assert.deepEqual(
    actionsForStatus("f1", "in_progress").map((action) => action.label),
    ["펀딩 취소", "제작·배송 현황"],
  );
  assert.deepEqual(
    actionsForStatus("f1", "production").map((action) => action.label),
    ["제작·배송 현황"],
  );
  assert.deepEqual(
    actionsForStatus("f1", "shipping").map((action) => action.label),
    ["제작·배송 현황"],
  );
  assert.deepEqual(
    actionsForStatus("f1", "delivered").map((action) => action.label),
    ["펀딩 환불", "제작·배송 현황"],
  );
});

test("금액은 천 단위 구분과 원 단위를 붙인다", () => {
  assert.equal(formatWon(599_000), "599,000원");
});

test("날짜는 점 구분으로 바꾸고 형식이 다르면 원문을 유지한다", () => {
  assert.equal(formatDate("2026-07-01"), "2026.07.01");
  assert.equal(formatDate("미정"), "미정");
});

test("상세 목업은 목록과 같은 id 규칙으로 상태를 복원하고, 모르는 id는 진행 중으로 본다", () => {
  assert.equal(demoFundingDetail("shipping").status, "shipping");
  assert.equal(demoFundingDetail("unknown-id").status, "in_progress");
});

test("목업 카드는 Figma 4개 카드처럼 상태마다 다른 상품을 보여준다", () => {
  const items = demoFundingHistoryItems();
  assert.equal(new Set(items.map((item) => item.projectTitle)).size, items.length);
  const inProgress = items.find((item) => item.status === "in_progress");
  assert.equal(inProgress.paidAt, "2026-09-15");
  assert.equal(inProgress.amount, 32_000);
});

test("상세 목업은 목록과 같은 상품·결제 일을 쓰고 참여 일도 같은 날이다", () => {
  const detail = demoFundingDetail("in_progress");
  assert.equal(detail.projectTitle, "탄탄하고 촉촉한 피부를 위한 데일리 콜라겐 크림");
  assert.equal(detail.participatedAt, detail.paidAt);
});
