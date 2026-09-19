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
  globalThis.fetch = () => {
    calls++;
    return new Promise((resolve) => {
      release = () => resolve(Response.json({ orderId: "order-uuid", finalAmount: 100 }));
    });
  };
  try {
    const first = submitOrderOnce(store, "member", body);
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
