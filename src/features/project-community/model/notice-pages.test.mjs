import assert from "node:assert/strict";
import test from "node:test";
import { noticePageCount } from "./notice-pages.ts";

test("응답의 전체 페이지 수를 쓰고, 0건이면 1페이지다", () => {
  assert.equal(noticePageCount({ totalPages: 3, hasNext: true }, 0), 3);
  assert.equal(noticePageCount({ totalPages: 0, hasNext: false }, 4), 1);
  assert.equal(noticePageCount({ totalPages: 1, hasNext: false }, 4), 1);
});

test("전체 페이지 수가 없을 때만 다음 페이지 여부로 센다", () => {
  assert.equal(noticePageCount({ hasNext: true }, 1), 3);
  assert.equal(noticePageCount({ hasNext: false }, 1), 2);
  assert.equal(noticePageCount(undefined, 0), 1);
});
