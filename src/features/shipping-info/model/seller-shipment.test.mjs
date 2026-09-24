import assert from "node:assert/strict";
import test from "node:test";
import {
  parseShippingView,
  shipmentResultMessage,
  shippingCounts,
  toShipment,
} from "./seller-shipment.ts";

const order = {
  orderId: "0198f2b1-2c3d-7a1e-9c4f-6a2b1e0d8f32",
  lineItems: [
    {
      rewardId: 1,
      rewardName: "스타터 세트",
      quantity: 2,
      unitPrice: 10000,
      options: [{ optionValueId: 3, optionGroupName: "색상", optionValue: "블랙" }],
    },
    { rewardId: 2, rewardName: "추가 필터", quantity: 1, unitPrice: 5000, options: [] },
  ],
  shippingAddress: {
    recipientName: "홍길동",
    phoneNumber: "01000000000",
    zipcode: "12345",
    addressLine1: "서울시 강남구",
    addressLine2: "",
  },
};

const record = (status, extra = {}) => ({
  fundingId: order.orderId,
  status,
  canConfirmReceipt: false,
  ...extra,
});

test("주문을 발송 행으로 바꾸고 발송일이 없으면 발송 대기다", () => {
  const row = toShipment(order);
  // Figma 100px 한 줄 칸에 맞춰 UUID 마지막 묶음만 보이고 전체는 따로 둔다.
  assert.equal(row.orderNo, "6a2b1e0d8f32");
  assert.equal(row.fullOrderNo, order.orderId);
  assert.equal(row.id, order.orderId);
  assert.equal(row.supporter, "홍길동");
  assert.equal(row.option, "스타터 세트 (색상: 블랙) / 추가 필터");
  assert.equal(row.quantity, 3);
  assert.equal(row.address, "서울시 강남구");
  assert.equal(row.status, "pending");
  // 송장 조회 전이거나 실패하면 택배사·운송장은 비어 있다.
  assert.equal(row.courier, "");
  assert.equal(row.trackingNo, "");
});

test("발송 여부는 주문 발송일을 따르고, 발송일 반영 전이면 송장 상태로도 판단한다", () => {
  assert.equal(toShipment({ ...order, shippedAt: "2026-09-24T01:00:00Z" }).status, "shipped");
  // 임시저장한 건은 송장 값이 있어도 PREPARING이라 발송 대기로 남는다.
  const saved = toShipment(
    order,
    record("PREPARING", { carrier: "CJ대한통운", trackingNumber: "123456789012" }),
  );
  assert.equal(saved.status, "pending");
  assert.equal(saved.courier, "CJ대한통운");
  assert.equal(saved.trackingNo, "123456789012");
  // 발송 이벤트로 주문 발송일이 채워지기 전이어도 송장이 발송 이후면 발송 완료다.
  for (const status of ["SHIPPED", "DELIVERED", "RECEIPT_CONFIRMED"])
    assert.equal(toShipment(order, record(status)).status, "shipped", status);
});

test("발송 처리·저장 결과는 처리·이미 발송·빈 입력·실패를 나눠 알린다", () => {
  const none = { done: 0, already: 0, skipped: 0, failed: 0 };
  assert.equal(shipmentResultMessage("ship", { ...none, done: 2 }), "2건을 발송 처리했어요.");
  assert.equal(
    shipmentResultMessage("ship", { done: 1, already: 1, skipped: 1, failed: 1 }),
    "1건을 발송 처리했어요. 이미 발송된 1건은 송장을 수정할 수 없어 발송 완료로 표시했어요. " +
      "택배사·운송장 번호가 비어 1건은 발송 처리하지 못했어요. 1건은 발송 처리하지 못했어요. 다시 시도해 주세요.",
  );
  assert.equal(
    shipmentResultMessage("save", { ...none, done: 2 }),
    "2건의 택배사·운송장을 저장했어요.",
  );
  // 처리한 건이 없으면 0건 문장 없이 이유만 알린다.
  assert.equal(
    shipmentResultMessage("save", { ...none, skipped: 3 }),
    "택배사·운송장 번호가 비어 3건은 저장하지 못했어요.",
  );
  assert.equal(
    shipmentResultMessage("save", { ...none, already: 1, failed: 2 }),
    "이미 발송된 1건은 송장을 수정할 수 없어 발송 완료로 표시했어요. 2건은 저장하지 못했어요. 다시 시도해 주세요.",
  );
  assert.equal(shipmentResultMessage("ship", none), "0건을 발송 처리했어요.");
});

test("전체 건수는 발송 대기와 발송 완료의 합이다", () => {
  assert.deepEqual(shippingCounts({ waiting: 3, shipped: 5 }), { all: 8, pending: 3, shipped: 5 });
});

test("URL의 탭·검색어·페이지를 읽고 모르는 값은 전체 탭·1페이지로 둔다", () => {
  assert.deepEqual(parseShippingView({}), { status: "all", search: "", page: 1 });
  assert.deepEqual(parseShippingView({ status: "shipped", search: "  홍길동 ", page: "3" }), {
    status: "shipped",
    search: "홍길동",
    page: 3,
  });
  assert.deepEqual(parseShippingView({ status: ["pending", "shipped"], page: ["2"] }), {
    status: "pending",
    search: "",
    page: 2,
  });
  for (const page of ["0", "-1", "1.5", "abc"])
    assert.equal(parseShippingView({ page }).page, 1, page);
  assert.equal(parseShippingView({ status: "WAITING" }).status, "all");
});
