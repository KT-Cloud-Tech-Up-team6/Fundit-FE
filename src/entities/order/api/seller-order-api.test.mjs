import assert from "node:assert/strict";
import test from "node:test";
import { authTokenStore } from "../../../shared/api/auth-token-store.ts";
import { getSellerOrders } from "./seller-order-api.ts";

test("판매자 발송 대상은 프로젝트 UUID별 목표 달성 주문 배열을 인증 조회한다", async (t) => {
  authTokenStore.set("seller-order-token");
  t.after(() => authTokenStore.clear());
  let call;
  t.mock.method(globalThis, "fetch", async (url, init) => {
    call = { url, init };
    return Response.json([]);
  });
  await getSellerOrders("project-uuid");
  assert.equal(call.url, "/api/v1/projects/project-uuid/orders");
  assert.equal(call.init.headers.get("Authorization"), "Bearer seller-order-token");
});
