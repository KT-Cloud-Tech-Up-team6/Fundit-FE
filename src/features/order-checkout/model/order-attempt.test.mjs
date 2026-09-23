import test from "node:test";
import assert from "node:assert/strict";
import { submitOrderOnce } from "./order-attempt.ts";
import {
  previewOrder,
  createPayment,
  confirmPayment,
  cancelOrder,
} from "../../../entities/order/api/order-api.ts";

const body = {
  projectId: "01990000-0000-7000-8000-000000000001",
  lineItems: [{ rewardId: 42, quantity: 2, optionValueIds: [71] }],
  shippingAddress: {
    recipientName: "수령인",
    phoneNumber: "01012345678",
    zipcode: "12345",
    addressLine1: "주소",
    addressLine2: "",
  },
  couponCodes: [],
};
function storage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}
/** POST마다 보낸 멱등 키와 본문을 모은다. */
function postLog() {
  const sent = [];
  return {
    sent,
    record(init) {
      sent.push({ key: init.headers.get("Idempotency-Key"), body: JSON.parse(init.body) });
    },
  };
}
test("중복 클릭은 요청 하나를 함께 기다리고 성공 후 재진입은 주문을 다시 만들지 않는다", async () => {
  const original = fetch,
    store = storage(),
    log = postLog();
  let release;
  globalThis.fetch = (url, init) => {
    if (init.method !== "POST") return Promise.resolve(Response.json({ status: "PENDING" }));
    log.record(init);
    return new Promise((resolve) => {
      release = () => resolve(Response.json({ orderId: "order-uuid", finalAmount: 100 }));
    });
  };
  try {
    const first = submitOrderOnce(store, "member", body);
    const second = submitOrderOnce(store, "member", body);
    while (!release) await new Promise((resolve) => setTimeout(resolve, 1));
    release();
    assert.equal((await first).orderId, "order-uuid");
    assert.equal((await second).orderId, "order-uuid");
    assert.equal((await submitOrderOnce(store, "member", body)).orderId, "order-uuid");
    assert.equal(log.sent.length, 1);
    assert.match(log.sent[0].key, /^[0-9a-f-]{36}$/);
  } finally {
    globalThis.fetch = original;
  }
});
test("응답 유실 뒤 재시도는 같은 키로 서버 주문을 되찾는다", async (t) => {
  const store = storage(),
    log = postLog();
  let lost = true;
  t.mock.method(globalThis, "fetch", async (url, init) => {
    if (init.method !== "POST") return Response.json({ status: "PENDING" });
    log.record(init);
    if (lost) {
      lost = false;
      throw new TypeError("network");
    }
    return Response.json({ orderId: "server-order" }, { status: 200 });
  });
  await assert.rejects(submitOrderOnce(store, "member", body), /같은 주문으로 이어집니다/);
  assert.equal((await submitOrderOnce(store, "member", body)).orderId, "server-order");
  assert.equal(log.sent.length, 2);
  assert.equal(log.sent[1].key, log.sent[0].key);
});
test("5xx 뒤에도 같은 키로 다시 보낸다", async (t) => {
  const store = storage(),
    log = postLog();
  let failed = false;
  t.mock.method(globalThis, "fetch", async (url, init) => {
    if (init.method !== "POST") return Response.json({ status: "PENDING" });
    log.record(init);
    if (!failed) {
      failed = true;
      return new Response("", { status: 503 });
    }
    return Response.json({ orderId: "server-order" });
  });
  await assert.rejects(submitOrderOnce(store, "member", body), /같은 주문으로 이어집니다/);
  assert.equal((await submitOrderOnce(store, "member", body)).orderId, "server-order");
  assert.equal(log.sent[1].key, log.sent[0].key);
});
test("확정된 4xx 실패는 시도를 버리고 새 키로 다시 주문한다", async (t) => {
  const store = storage(),
    log = postLog();
  let rejected = false;
  t.mock.method(globalThis, "fetch", async (url, init) => {
    log.record(init);
    if (!rejected) {
      rejected = true;
      return Response.json({ code: "INSUFFICIENT_STOCK", message: "재고 부족" }, { status: 409 });
    }
    return Response.json({ orderId: "server-order" });
  });
  await assert.rejects(submitOrderOnce(store, "member", body), /재고 부족/);
  assert.equal((await submitOrderOnce(store, "member", body)).orderId, "server-order");
  assert.notEqual(log.sent[1].key, log.sent[0].key);
});
test("같은 키 요청이 처리 중인 409 CONFLICT는 시도를 유지해 같은 키로 다시 보낸다", async (t) => {
  const store = storage(),
    log = postLog();
  let busy = true;
  t.mock.method(globalThis, "fetch", async (url, init) => {
    if (init.method !== "POST") return Response.json({ status: "PENDING" });
    log.record(init);
    if (busy) {
      busy = false;
      return Response.json(
        { code: "CONFLICT", message: "동일한 Idempotency-Key로 처리 중인 요청이 있습니다." },
        { status: 409 },
      );
    }
    return Response.json({ orderId: "server-order" });
  });
  await assert.rejects(submitOrderOnce(store, "member", body), /잠시 후 다시 시도/);
  assert.equal((await submitOrderOnce(store, "member", body)).orderId, "server-order");
  assert.equal(log.sent[1].key, log.sent[0].key);
});
test("응답 유실 뒤 주문 내용을 바꾸면 이전 시도를 원래 본문으로 확정한 뒤 결제 대기를 안내한다", async (t) => {
  const store = storage(),
    log = postLog();
  let lost = true;
  t.mock.method(globalThis, "fetch", async (url, init) => {
    if (init.method !== "POST") return Response.json({ status: "PENDING" });
    log.record(init);
    if (lost) {
      lost = false;
      throw new TypeError("lost");
    }
    return Response.json({ orderId: "old-order" });
  });
  await assert.rejects(submitOrderOnce(store, "member", body));
  await assert.rejects(
    submitOrderOnce(store, "member", { ...body, couponCodes: ["changed"] }),
    /결제 대기 주문/,
  );
  assert.equal(log.sent.length, 2);
  assert.equal(log.sent[1].key, log.sent[0].key);
  assert.deepEqual(log.sent[1].body, body);
});
test("미리보기와 결제는 서버 금액·서버 ID를 그대로 사용한다", async () => {
  const original = fetch,
    calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, body: init.body && JSON.parse(init.body) });
    return Response.json({ finalAmount: 73100 });
  };
  try {
    assert.equal((await previewOrder(body)).finalAmount, 73100);
    await createPayment("order-uuid");
    await confirmPayment({ paymentKey: "callback-key", orderId: "pg-order-id", amount: 73100 });
    await cancelOrder("order-uuid");
    assert.equal(calls[0].url, "/api/v1/orders/preview");
    assert.deepEqual(calls[1].body, { fundingId: "order-uuid" });
    assert.equal(calls[2].body.orderId, "pg-order-id");
    assert.equal(calls[3].url, "/api/v1/orders/order-uuid/cancel");
  } finally {
    globalThis.fetch = original;
  }
});

test("결제 대기 주문과 다른 내용은 이전 주문으로 이동하지 않고 확인을 요청한다", async (t) => {
  const store = storage();
  let posts = 0;
  t.mock.method(globalThis, "fetch", async (url, init) => {
    if (init.method === "POST") {
      posts++;
      return Response.json({ orderId: "old-order" });
    }
    return Response.json({ status: "PENDING" });
  });
  await submitOrderOnce(store, "member", body);
  await assert.rejects(
    submitOrderOnce(store, "member", {
      ...body,
      lineItems: [{ rewardId: 77, quantity: 1, optionValueIds: [] }],
    }),
    /결제 대기 주문/,
  );
  assert.equal(posts, 1);
  assert.equal((await submitOrderOnce(store, "member", body)).orderId, "old-order");
});
for (const status of [
  "CANCELLED_BY_MEMBER",
  "PAYMENT_EXPIRED",
  "FUNDING_IN_PROGRESS",
  "GOAL_ACHIEVED",
])
  test(status + " 주문을 새 주문 결과로 재사용하지 않고 새 키로 주문한다", async (t) => {
    const store = storage(),
      log = postLog();
    t.mock.method(globalThis, "fetch", async (url, init) => {
      if (init.method !== "POST") return Response.json({ status });
      log.record(init);
      return Response.json({ orderId: "order-" + log.sent.length });
    });
    await submitOrderOnce(store, "member", body);
    const second = await submitOrderOnce(store, "member", body);
    assert.equal(second.orderId, "order-2");
    assert.notEqual(log.sent[1].key, log.sent[0].key);
  });
test("기존 주문 상태 조회 실패 시 새 주문 생성을 차단하고 기존 기록 유지", async (t) => {
  const store = storage();
  let posts = 0;
  t.mock.method(globalThis, "fetch", async (url, init) =>
    init.method === "POST"
      ? (posts++, Response.json({ orderId: "old" }))
      : new Response("", { status: 503 }),
  );
  await submitOrderOnce(store, "member", body);
  await assert.rejects(submitOrderOnce(store, "member", body));
  await assert.rejects(submitOrderOnce(store, "member", body));
  assert.equal(posts, 1);
});
test("응답에 주문 ID가 없으면 결과를 재사용하지 않고 같은 키로만 다시 보낸다", async (t) => {
  const store = storage(),
    log = postLog();
  t.mock.method(globalThis, "fetch", async (url, init) => {
    log.record(init);
    return Response.json({});
  });
  await assert.rejects(submitOrderOnce(store, "member", body), /주문 결과/);
  await assert.rejects(submitOrderOnce(store, "member", body), /주문 결과/);
  assert.equal(log.sent.length, 2);
  assert.equal(log.sent[1].key, log.sent[0].key);
});
