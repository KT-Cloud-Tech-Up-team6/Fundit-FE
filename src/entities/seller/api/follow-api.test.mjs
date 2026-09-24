import assert from "node:assert/strict";
import test from "node:test";
import { followSeller, followsQueryKey, getAllFollows, unfollowSeller } from "./follow-api.ts";
import { authTokenStore } from "@/shared/api/auth-token-store";

const sellerId = "7b3f0d3e-4bdf-4f7a-8e05-3046ec739d87";
const follow = (id) => ({
  sellerId: id,
  sellerName: "판매자",
  sellerNickname: "nick",
  createdAt: "2026-09-24T00:00:00Z",
});

test("팔로우 목록은 한 페이지 최대 크기로 마지막 페이지까지 모두 읽는다", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (input, init = {}) => {
    calls.push([String(input), init]);
    const page = Number(new URL(String(input), "https://example.test").searchParams.get("page"));
    return Response.json({
      content: [follow(`seller-${page}`)],
      page,
      size: 100,
      totalElements: 2,
      totalPages: 2,
      hasNext: page === 0,
    });
  });
  authTokenStore.set("member-token");
  t.after(() => authTokenStore.clear());
  const controller = new AbortController();

  const follows = await getAllFollows(controller.signal);

  assert.deepEqual(
    follows.map((item) => item.sellerId),
    ["seller-0", "seller-1"],
  );
  assert.deepEqual(
    calls.map(([url]) => url),
    ["/api/v1/follows?page=0&size=100", "/api/v1/follows?page=1&size=100"],
  );
  assert.equal(calls[0][1].headers.get("Authorization"), "Bearer member-token");
  assert.equal(calls[0][1].signal, controller.signal);
});

test("팔로우는 PUT, 언팔로우는 DELETE(204)로 보낸다", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (input, init = {}) => {
    calls.push([String(input), init]);
    return init.method === "DELETE"
      ? new Response(null, { status: 204 })
      : Response.json({ sellerId, following: true });
  });
  authTokenStore.set("member-token");
  t.after(() => authTokenStore.clear());

  assert.deepEqual(await followSeller(sellerId), { sellerId, following: true });
  assert.equal(await unfollowSeller(sellerId), undefined);
  assert.equal(calls[0][0], `/api/v1/follows/${sellerId}`);
  assert.equal(calls[0][1].method, "PUT");
  assert.equal(calls[1][1].method, "DELETE");
  assert.equal(calls[1][1].headers.get("Authorization"), "Bearer member-token");
});

test("자기 자신 팔로우(400)는 오류로 전달한다", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({ code: "INVALID_INPUT" }, { status: 400 }),
  );
  await assert.rejects(followSeller(sellerId), { status: 400, code: "INVALID_INPUT" });
});

test("팔로우 목록 키는 회원별로 나뉜다", () => {
  assert.deepEqual(followsQueryKey("member-a"), ["follows", "member-a"]);
  assert.notDeepEqual(followsQueryKey("member-a"), followsQueryKey("member-b"));
});
