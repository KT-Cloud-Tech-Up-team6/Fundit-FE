import assert from "node:assert/strict";
import test from "node:test";
import { getPublicLives } from "./public-live-api.ts";

test("소비자 LIVE 목록은 비인증으로 상태·정렬·판매자 필터를 보낸다", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    calls.push({ url, init });
    return Response.json({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 });
  });

  await getPublicLives({});
  await getPublicLives({ status: "LIVE", sort: "viewerCount" });
  await getPublicLives({ status: "SCHEDULED", sellerIds: ["a", "b"] });
  await getPublicLives({ status: "LIVE", sellerIds: [] });

  assert.equal(calls[0].url, "/api/v1/lives");
  const ranking = new URL(calls[1].url, "https://example.com");
  assert.equal(ranking.searchParams.get("status"), "LIVE");
  assert.equal(ranking.searchParams.get("sort"), "viewerCount");
  const following = new URL(calls[2].url, "https://example.com");
  assert.equal(following.pathname, "/api/v1/lives");
  assert.equal(following.searchParams.get("status"), "SCHEDULED");
  assert.equal(following.searchParams.get("sellerId"), "a,b");
  // 빈 판매자 목록은 필터를 붙이지 않는다.
  assert.equal(new URL(calls[3].url, "https://example.com").searchParams.has("sellerId"), false);
  for (const { init } of calls) assert.equal(new Headers(init.headers).has("Authorization"), false);
});
