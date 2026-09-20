import assert from "node:assert/strict";
import test from "node:test";
import {
  deleteRecentKeyword,
  getPopularKeywords,
  getRecentKeywords,
  searchSellers,
} from "./search-api.ts";
import { searchProjects } from "../../../entities/project/api/buyer-project-api.ts";
import { authTokenStore } from "../../../shared/api/auth-token-store.ts";

test("최근 검색어는 인증을 전달하고 특수문자를 포함한 삭제 경로와 204를 처리한다", async (t) => {
  authTokenStore.set("search-test");
  t.after(() => authTokenStore.clear());
  const calls = [];
  const controller = new AbortController();
  t.mock.method(globalThis, "fetch", async (url, init) => {
    calls.push({ url, init });
    return init.method === "DELETE"
      ? new Response(null, { status: 204 })
      : Response.json({
          content: [{ keyword: "청소기/물 & 먼지", searchedAt: "2026-09-19T00:00:00Z" }],
        });
  });
  const recent = await getRecentKeywords(controller.signal);
  assert.equal(recent.content[0].keyword, "청소기/물 & 먼지");
  assert.equal(calls[0].init.signal, controller.signal);
  assert.equal(calls[0].init.headers.get("Authorization"), "Bearer search-test");
  assert.equal(await deleteRecentKeyword(recent.content[0].keyword), undefined);
  assert.equal(
    calls[1].url,
    `/api/v1/search/recent-keywords/${encodeURIComponent("청소기/물 & 먼지")}`,
  );
  assert.equal(calls[1].init.method, "DELETE");
  assert.equal(calls[1].init.headers.get("Authorization"), "Bearer search-test");
});

test("판매자 검색의 페이지·UUID와 인기 검색어의 서버 순위를 보존한다", async (t) => {
  authTokenStore.set("search-test");
  t.after(() => authTokenStore.clear());
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    calls.push({ url, init });
    return Response.json(
      url.includes("sellers")
        ? {
            content: [
              { sellerId: "01990000-0000-7000-8000-000000000001", sellerDisplayName: "메이커" },
            ],
            totalElements: 21,
            hasNext: false,
          }
        : { content: [{ rank: 3, keyword: "물 & 먼지" }] },
    );
  });
  const sellers = await searchSellers("물 & 먼지", 1);
  const url = new URL(calls[0].url, "https://example.com");
  assert.equal(url.searchParams.get("keyword"), "물 & 먼지");
  assert.equal(url.searchParams.get("page"), "1");
  assert.equal(url.searchParams.get("size"), "20");
  assert.equal(sellers.content[0].sellerId, "01990000-0000-7000-8000-000000000001");
  assert.equal(sellers.totalElements, 21);
  assert.equal(calls[0].init.headers.has("Authorization"), false);
  assert.deepEqual((await getPopularKeywords()).content, [{ rank: 3, keyword: "물 & 먼지" }]);
  assert.equal(calls[1].url, "/api/v1/search/popular-keywords");
  assert.equal(calls[1].init.headers.has("Authorization"), false);
});

test("회원 프로젝트 검색만 인증하고 삭제 실패를 성공으로 취급하지 않는다", async (t) => {
  authTokenStore.set("search-test");
  t.after(() => authTokenStore.clear());
  const headers = [];
  t.mock.method(globalThis, "fetch", async (_url, init) => {
    headers.push(init.headers);
    return Response.json({ content: [] });
  });
  await searchProjects("검색어", "POPULAR", false, 0, undefined, true);
  await searchProjects("검색어", "POPULAR", false, 0);
  assert.equal(headers[0].get("Authorization"), "Bearer search-test");
  assert.equal(headers[1].has("Authorization"), false);
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({ code: "DEPENDENCY_FAILURE" }, { status: 503 }),
  );
  await assert.rejects(deleteRecentKeyword("검색어"), { status: 503 });
});
