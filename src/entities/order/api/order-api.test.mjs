import assert from "node:assert/strict";
import test from "node:test";
import { authTokenStore } from "../../../shared/api/auth-token-store.ts";
import {
  previewOrder,
  createOrder,
  getOrders,
  getOrder,
  cancelOrder,
  createPayment,
  confirmPayment,
} from "./order-api.ts";

test("UUID 주문 미리보기·생성·목록은 통합된 v1 계약으로 요청한다", async (t) => {
  authTokenStore.set("order-test-token");
  t.after(() => authTokenStore.clear());
  const projectId = "0198f2b1-2c3d-7a1e-9c4f-6a2b1e0d8f31";
  const orderId = "0198f2b1-2c3d-7a1e-9c4f-6a2b1e0d8f32";
  const body = {
    projectId,
    lineItems: [{ rewardId: 12, quantity: 2, optionValueIds: [31] }],
    shippingAddress: {
      recipientName: "테스트",
      phoneNumber: "01000000000",
      zipcode: "12345",
      addressLine1: "테스트 주소",
      addressLine2: "",
    },
    couponCodes: ["SAVE"],
  };
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    calls.push({ url, init });
    if (url.startsWith("/api/v1/orders")) {
      return Response.json({ orderId, projectId, finalAmount: 17000, content: [], hasNext: false });
    }
    return Response.json({ code: "NOT_FOUND", message: "없는 API 경로" }, { status: 404 });
  });
  assert.equal((await previewOrder(body)).finalAmount, 17000);
  assert.equal((await createOrder(body)).orderId, orderId);
  const signal = new AbortController().signal;
  await getOrders(1, "GOAL_ACHIEVED", signal);
  await getOrders(0, "");

  assert.deepEqual(
    calls.map(({ url }) => url),
    [
      "/api/v1/orders/preview",
      "/api/v1/orders",
      "/api/v1/orders?page=1&size=20&status=GOAL_ACHIEVED",
      "/api/v1/orders?page=0&size=20",
    ],
  );
  for (const { init } of calls) {
    assert.equal(init.headers.get("Authorization"), "Bearer order-test-token");
    assert.equal(init.credentials, "include");
  }
  for (const { init } of calls.slice(0, 2)) {
    assert.equal(init.method, "POST");
    assert.deepEqual(JSON.parse(init.body), body);
  }
  assert.equal(calls[2].init.signal, signal);
});

test("주문 상세·취소는 v1, 결제 시도·승인은 v2와 PG 주문번호를 유지한다", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    calls.push({ url, init });
    return Response.json({});
  });
  await getOrder("order-uuid");
  await cancelOrder("order-uuid");
  await createPayment("order-uuid");
  const confirmation = { paymentKey: "test-payment-key", orderId: "pg-order", amount: 17000 };
  await confirmPayment(confirmation);
  assert.deepEqual(
    calls.map(({ url }) => url),
    [
      "/api/v1/orders/order-uuid",
      "/api/v1/orders/order-uuid/cancel",
      "/api/v2/payments",
      "/api/v2/payments/confirm",
    ],
  );
  assert.deepEqual(JSON.parse(calls[2].init.body), { fundingId: "order-uuid" });
  assert.deepEqual(JSON.parse(calls[3].init.body), confirmation);
});
