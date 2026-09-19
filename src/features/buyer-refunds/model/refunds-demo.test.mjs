import assert from "node:assert/strict";
import test from "node:test";
import { filterRefundHistory, refundBadgeVariant, refundHistory } from "./refunds-demo.ts";

test("유형 필터는 전체면 전부, 아니면 해당 유형만 남긴다", () => {
  assert.equal(filterRefundHistory(refundHistory, "전체", false).length, refundHistory.length);
  assert.deepEqual(
    filterRefundHistory(refundHistory, "환불", false).map((entry) => entry.type),
    ["환불"],
  );
});

test("진행 중만 보기는 상태에 진행 중이 포함된 항목만 남긴다", () => {
  const filtered = filterRefundHistory(refundHistory, "전체", true);
  assert.deepEqual(
    filtered.map((entry) => entry.id),
    ["cancel-pending"],
  );
});

test("두 필터는 함께 적용된다", () => {
  assert.equal(filterRefundHistory(refundHistory, "환불", true).length, 0);
});

test("배지 색상은 진행 중이면 warning, 아니면 neutral이다", () => {
  assert.equal(refundBadgeVariant("취소 진행 중"), "warning");
  assert.equal(refundBadgeVariant("취소 완료"), "neutral");
});
