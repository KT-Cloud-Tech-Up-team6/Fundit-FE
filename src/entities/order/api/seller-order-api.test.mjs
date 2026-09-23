import assert from "node:assert/strict";
import test from "node:test";
import { authTokenStore } from "../../../shared/api/auth-token-store.ts";
import { getSellerOrderShippingCounts, getSellerOrders } from "./seller-order-api.ts";

const projectId = "0198f2b1-2c3d-7a1e-9c4f-6a2b1e0d8f31";

test("판매자 발송 목록은 상태 필터·0부터 센 페이지·크기를 보내고 페이지 응답을 그대로 돌려준다", async (t) => {
  authTokenStore.set("seller-order-token");
  t.after(() => authTokenStore.clear());
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    calls.push({ url, init });
    return Response.json({ content: [], page: 1, size: 20, totalElements: 21, totalPages: 2 });
  });

  const result = await getSellerOrders(projectId, {
    q: "",
    shippingFilter: "WAITING",
    page: 1,
  });
  assert.equal(result.totalPages, 2);
  const url = new URL(calls[0].url, "https://example.com");
  assert.equal(url.pathname, `/api/v1/projects/${projectId}/orders`);
  assert.equal(url.searchParams.get("shippingFilter"), "WAITING");
  assert.equal(url.searchParams.get("page"), "1");
  assert.equal(url.searchParams.get("size"), "20");
  assert.equal(url.searchParams.has("q"), false);
  assert.equal(
    new Headers(calls[0].init.headers).get("Authorization"),
    "Bearer seller-order-token",
  );

  await getSellerOrders(projectId, { q: "홍길동 & 0198", shippingFilter: "ALL", page: 0 });
  assert.equal(new URL(calls[1].url, "https://example.com").searchParams.get("q"), "홍길동 & 0198");
});

test("탭 건수는 인증해서 발송 대기·완료 건수 경로로 요청한다", async (t) => {
  authTokenStore.set("seller-order-token");
  t.after(() => authTokenStore.clear());
  let request;
  t.mock.method(globalThis, "fetch", async (url, init) => {
    request = { url, init };
    return Response.json({ waiting: 3, shipped: 5 });
  });

  assert.deepEqual(await getSellerOrderShippingCounts(projectId), { waiting: 3, shipped: 5 });
  assert.equal(request.url, `/api/v1/projects/${projectId}/orders/shipping-status-counts`);
  assert.equal(new Headers(request.init.headers).get("Authorization"), "Bearer seller-order-token");
});
