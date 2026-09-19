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
test("중복 클릭과 성공 후 재진입은 주문을 다시 만들지 않는다", async () => {
  const original = fetch,
    store = storage();
  let calls = 0,
    release;
  globalThis.fetch = (url, init) => {
    if (init.method !== "POST") return Promise.resolve(Response.json({ status: "PENDING" }));
    calls++;
    return new Promise((resolve) => {
      release = () => resolve(Response.json({ orderId: "order-uuid", finalAmount: 100 }));
    });
  };
  try {
    const first = submitOrderOnce(store, "member", body);
    while (!release) await new Promise((resolve) => setTimeout(resolve, 1));
    await assert.rejects(submitOrderOnce(store, "member", body), /이전 주문/);
    release();
    await first;
    await submitOrderOnce(store, "member", body);
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = original;
  }
});
test("응답 유실은 재생성을 막고 확정된 409 실패만 재시도한다", async () => {
  const original = fetch;
  try {
    const unknown = storage();
    globalThis.fetch = async () => {
      throw new TypeError("network");
    };
    await assert.rejects(submitOrderOnce(unknown, "member", body));
    await assert.rejects(submitOrderOnce(unknown, "member", body), /이전 주문/);
    const rejected = storage();
    globalThis.fetch = async () => Response.json({ message: "재고 부족" }, { status: 409 });
    await assert.rejects(submitOrderOnce(rejected, "member", body), /재고 부족/);
    globalThis.fetch = async () => Response.json({ orderId: "server-order" });
    assert.equal((await submitOrderOnce(rejected, "member", body)).orderId, "server-order");
  } finally {
    globalThis.fetch = original;
  }
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
    assert.equal(calls[0].url, "/api/v2/orders/preview");
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
  test(status + " 주문을 새 주문 결과로 재사용하지 않는다", async (t) => {
    const store = storage();
    let posts = 0;
    t.mock.method(globalThis, "fetch", async (url, init) =>
      init.method === "POST"
        ? Response.json({ orderId: "order-" + ++posts })
        : Response.json({ status }),
    );
    await submitOrderOnce(store, "member", body);
    const second = await submitOrderOnce(store, "member", body);
    assert.equal(second.orderId, "order-2");
    assert.equal(posts, 2);
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
test("응답 유실 후 주문 내용을 바꿔도 불확실한 요청을 반복하지 않는다", async (t) => {
  const store = storage();
  let posts = 0;
  t.mock.method(globalThis, "fetch", async () => {
    posts++;
    throw new TypeError("lost");
  });
  await assert.rejects(submitOrderOnce(store, "member", body));
  await assert.rejects(
    submitOrderOnce(store, "member", { ...body, couponCodes: ["changed"] }),
    /이전 주문/,
  );
  assert.equal(posts, 1);
});
test("응답에 주문 ID가 없으면 생성 결과를 재사용하거나 다시 생성하지 않는다", async (t) => {
  const store = storage();
  let posts = 0;
  t.mock.method(globalThis, "fetch", async () => {
    posts++;
    return Response.json({});
  });
  await assert.rejects(submitOrderOnce(store, "member", body), /주문 결과/);
  await assert.rejects(submitOrderOnce(store, "member", body), /이전 주문/);
  assert.equal(posts, 1);
});
