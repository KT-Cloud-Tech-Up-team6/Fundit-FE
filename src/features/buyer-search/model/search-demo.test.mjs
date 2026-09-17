import assert from "node:assert/strict";
import test from "node:test";
import {
  addRecentSearch,
  defaultSearch,
  parseSearch,
  searchResults,
  searchUrl,
} from "./search-demo.ts";

test("검색 URL은 조건을 복원하고 알 수 없는 값은 기본값으로 정규화한다", () => {
  const query = {
    q: "무선 청소기",
    tab: "live",
    status: "upcoming",
    sort: "popular",
    closed: true,
  };
  assert.deepEqual(
    parseSearch(new URL(searchUrl(query), "https://example.test").searchParams),
    query,
  );
  assert.deepEqual(
    parseSearch(new URLSearchParams("tab=bad&status=bad&sort=bad&q=%20%20")),
    defaultSearch,
  );
});

test("종료 필터와 정렬은 실제 목록에 적용되며 원본을 변경하지 않는다", () => {
  const query = { ...defaultSearch, q: "청소기" };
  const results = searchResults(query).projects;
  assert.ok(results.length > 0);
  assert.ok(results.every((project) => !project.closed));
  assert.equal(searchResults({ ...query, closed: true }).projects.length, results.length + 1);
  const sorted = searchResults({ ...query, sort: "popular" }).projects;
  assert.ok(sorted.every((item, index) => index === 0 || sorted[index - 1].likes >= item.likes));
  assert.deepEqual(searchResults(query).projects, results);
  assert.equal(searchResults({ ...query, q: "존재하지않는검색어" }).projects.length, 0);
});

test("라이브 상태를 분리하고 최근 검색어 중복과 빈 입력을 처리한다", () => {
  for (const status of ["live", "upcoming"]) {
    const lives = searchResults({ ...defaultSearch, q: "청소기", status }).lives;
    assert.ok(lives.length > 0);
    assert.ok(lives.every((live) => live.status === status));
  }
  assert.deepEqual(addRecentSearch(["수박", "청소기"], " 청소기 "), ["청소기", "수박"]);
  assert.deepEqual(addRecentSearch(["수박"], "  "), ["수박"]);
});
