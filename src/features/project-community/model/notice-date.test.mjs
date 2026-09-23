import assert from "node:assert/strict";
import test from "node:test";
import { formatNoticeDate } from "./notice-date.ts";

test("새 소식 등록일은 한국 날짜로 표시한다", () => {
  assert.equal(formatNoticeDate("2026-09-22T16:00:00Z"), "2026.09.23");
  assert.equal(formatNoticeDate("invalid-date"), "invalid-date");
});
