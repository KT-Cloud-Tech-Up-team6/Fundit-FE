import assert from "node:assert/strict";
import test from "node:test";
import {
  actionsForStatus,
  demoFundingDetail,
  demoFundingHistoryItems,
  filterFundingHistory,
  formatDate,
  formatWon,
} from "./funding-history.ts";

test("검색어는 제목 일부·대소문자 무시로 매칭한다", () => {
  const items = demoFundingHistoryItems();
  assert.equal(filterFundingHistory(items, "무선청소기", "all").length, items.length);
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

test("상태별 액션 버튼 구성은 Figma 카드와 같다", () => {
  assert.deepEqual(
    actionsForStatus("f1", "in_progress").map((action) => action.label),
    ["펀딩 취소", "제작·배송 현황"],
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
