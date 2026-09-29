import assert from "node:assert/strict";
import test from "node:test";
import { authTokenStore } from "../../../shared/api/auth-token-store.ts";
import {
  previewOrder,
  createOrder,
  getOrders,
  getAllOrders,
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
  assert.equal((await createOrder(body, "attempt-key")).orderId, orderId);
  const signal = new AbortController().signal;
  await getOrders(1, { q: "콜라겐 크림", from: "2026-08-29", to: "2026-09-29" }, signal);
  await getOrders(0);
  await getOrders(0, { q: "", from: "2026-06-29", to: "2026-09-29" });

  assert.deepEqual(
    calls.map(({ url }) => url),
    [
      "/api/v1/orders/preview",
      "/api/v1/orders",
      "/api/v1/orders?page=1&size=20&sort=createdAt%2Cdesc&q=%EC%BD%9C%EB%9D%BC%EA%B2%90+%ED%81%AC%EB%A6%BC&from=2026-08-29&to=2026-09-29",
      "/api/v1/orders?page=0&size=20&sort=createdAt%2Cdesc",
      "/api/v1/orders?page=0&size=20&sort=createdAt%2Cdesc&from=2026-06-29&to=2026-09-29",
    ],
  );
  for (const { init } of calls) {
    assert.equal(init.headers.get("Authorization"), "Bearer order-test-token");
    assert.equal(init.credentials, "include");
  }
  assert.equal(calls[0].init.headers.get("Idempotency-Key"), null);
  assert.equal(calls[1].init.headers.get("Idempotency-Key"), "attempt-key");
  for (const { init } of calls.slice(0, 2)) {
    assert.equal(init.method, "POST");
    assert.deepEqual(JSON.parse(init.body), body);
  }
  assert.equal(calls[2].init.signal, signal);
});

test("목록 status는 반복 파라미터로 보내고 크기를 바꿀 수 있다", async (t) => {
  const urls = [];
  t.mock.method(globalThis, "fetch", async (url) => {
    urls.push(url);
    return Response.json({ content: [], totalElements: 0, hasNext: false });
  });
  await getOrders(0, { status: ["PENDING", "FUNDING_IN_PROGRESS"], from: "2026-08-29" });
  await getOrders(2, { status: ["GOAL_ACHIEVED"] }, undefined, 100);
  assert.deepEqual(urls, [
    "/api/v1/orders?page=0&size=20&sort=createdAt%2Cdesc&from=2026-08-29&status=PENDING&status=FUNDING_IN_PROGRESS",
    "/api/v1/orders?page=2&size=100&sort=createdAt%2Cdesc&status=GOAL_ACHIEVED",
  ]);
});

test("전체 목록은 100건씩 hasNext가 끝날 때까지, 최대 20번까지 받는다", async (t) => {
  const pages = [];
  let total = 250;
  t.mock.method(globalThis, "fetch", async (url) => {
    const params = new URL(url, "http://localhost").searchParams;
    const page = Number(params.get("page"));
    pages.push([page, params.get("size"), params.getAll("status")]);
    const content = Array.from(
      { length: Math.max(0, Math.min(100, total - page * 100)) },
      (_, i) => ({
        orderId: String(page * 100 + i),
      }),
    );
    return Response.json({ content, totalElements: total, hasNext: (page + 1) * 100 < total });
  });
  const all = await getAllOrders({ status: ["GOAL_ACHIEVED"] });
  assert.equal(all.content.length, 250);
  assert.equal(all.truncated, false);
  assert.deepEqual(pages, [
    [0, "100", ["GOAL_ACHIEVED"]],
    [1, "100", ["GOAL_ACHIEVED"]],
    [2, "100", ["GOAL_ACHIEVED"]],
  ]);

  pages.length = 0;
  total = 5_000;
  const capped = await getAllOrders({});
  assert.equal(pages.length, 20);
  assert.equal(capped.content.length, 2_000);
  assert.equal(capped.truncated, true);
});

test("쪽을 받는 사이 새 주문으로 밀려 다음 쪽에 다시 온 주문은 한 번만 담는다", async (t) => {
  /* 첫 쪽을 받은 뒤 새 주문이 생겨 최신순 목록이 한 칸 밀리면 첫 쪽의 끝(o99)이 둘째 쪽 맨 앞에 다시 온다. */
  const pageOf = (page) => {
    const start = page === 0 ? 0 : page * 100 - 1;
    return Array.from({ length: Math.min(100, 150 - start) }, (_, i) => ({
      orderId: `o${start + i}`,
    }));
  };
  t.mock.method(globalThis, "fetch", async (url) => {
    const page = Number(new URL(url, "http://localhost").searchParams.get("page"));
    return Response.json({ content: pageOf(page), totalElements: 151, hasNext: page === 0 });
  });
  const all = await getAllOrders({ status: ["GOAL_ACHIEVED"] });
  const ids = all.content.map((order) => order.orderId);
  assert.equal(ids.length, 150);
  assert.equal(new Set(ids).size, 150);
  assert.deepEqual(ids.slice(98, 101), ["o98", "o99", "o100"]);
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

test("참여 취소는 사유가 있으면 본문으로 보내고 없으면 본문 없이 보낸다", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    calls.push(init);
    return Response.json({ orderId: "order-uuid", status: "CANCELLED_BY_MEMBER" });
  });
  await cancelOrder("order-uuid", { cancelReason: "ETC", reasonDetail: "주소 변경" });
  await cancelOrder("order-uuid");
  assert.deepEqual(JSON.parse(calls[0].body), { cancelReason: "ETC", reasonDetail: "주소 변경" });
  assert.equal(calls[0].headers.get("Content-Type"), "application/json");
  assert.equal(calls[1].body, undefined);
  assert.equal(calls[1].headers.get("Content-Type"), null);
});
