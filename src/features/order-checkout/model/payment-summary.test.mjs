import assert from "node:assert/strict";
import test from "node:test";
import { demoSummaryRows, previewSummaryRows } from "./payment-summary.ts";
import { demoPaymentSummary } from "./checkout-demo.ts";

/* 주문 줄: 얼리 버드 180,000(정가 200,000) × 2개, 일반 150,000 × 1개. 청구 합계 510,000, 정가 합계 550,000. */
const items = [
  { label: "얼리버드 세트 · 2개", price: 360_000, originalPrice: 400_000 },
  { label: "기본 세트 · 1개", price: 150_000 },
];

test("실제 주문서 결제 금액은 펀딩 금액을 정가 합계로, 차액을 얼리버드 할인으로 두고 적립금 줄은 없다", () => {
  // BE #181: rewardAmount는 얼리 버드 할인가 합계, discountAmount는 쿠폰 할인이다.
  const rows = previewSummaryRows(
    {
      rewardAmount: 510_000,
      shippingFee: 3_000,
      discountAmount: 10_000,
      finalAmount: 503_000,
      appliedCoupons: [{ couponCode: "SAVE", issuerType: "PLATFORM", discountType: "AMOUNT" }],
    },
    items,
  );
  assert.deepEqual(rows, {
    order: [
      { label: "총 주문 금액", amount: 553_000 },
      { label: "ㄴ펀딩 금액", amount: 550_000 },
      { label: "ㄴ배송비", amount: 3_000 },
    ],
    discount: [
      { label: "총 할인 금액", amount: 50_000 },
      { label: "ㄴ얼리버드 할인", amount: 40_000 },
      { label: "ㄴ쿠폰 사용", amount: 10_000 },
    ],
    finalAmount: 503_000,
  });
  // 총 주문 금액 − 총 할인 금액이 BE 최종 결제 금액과 같다.
  assert.equal(rows.order[0].amount - rows.discount[0].amount, rows.finalAmount);
});

test("얼리 버드 줄이 없으면 얼리버드 할인은 0원 줄이다", () => {
  const rows = previewSummaryRows(
    { rewardAmount: 150_000, shippingFee: 3_000, discountAmount: 0, finalAmount: 153_000 },
    [items[1]],
  );
  assert.deepEqual(
    rows.order.map((row) => row.amount),
    [153_000, 150_000, 3_000],
  );
  assert.deepEqual(
    rows.discount.map((row) => row.amount),
    [0, 0, 0],
  );
});

test("미리보기 금액이 줄 청구 합계와 다르면 가격 차이를 얼리버드 할인으로 추정하지 않고 BE 금액만 쓴다", () => {
  // BE #181 이전 BE는 정가(550,000)로, 조회 사이 가격이 바뀌면 또 다른 값으로 계산한다.
  for (const rewardAmount of [550_000, 500_000]) {
    const rows = previewSummaryRows(
      { rewardAmount, shippingFee: 3_000, discountAmount: 0, finalAmount: rewardAmount + 3_000 },
      items,
    );
    assert.deepEqual(
      rows.order.map((row) => row.amount),
      [rewardAmount + 3_000, rewardAmount, 3_000],
      String(rewardAmount),
    );
    assert.deepEqual(
      rows.discount.map((row) => row.amount),
      [0, 0, 0],
      String(rewardAmount),
    );
  }
});

test("최종 결제 금액은 합계로 다시 계산하지 않고 BE finalAmount를 따른다", () => {
  const rows = previewSummaryRows(
    { rewardAmount: 150_000, shippingFee: 3_000, discountAmount: 200_000, finalAmount: 0 },
    [items[1]],
  );
  assert.equal(rows.finalAmount, 0);
  assert.deepEqual(
    rows.discount.map((row) => row.amount),
    [200_000, 0, 200_000],
  );
});

test("데모 결제 금액은 기존 계산(얼리버드·쿠폰·적립금 포함)을 유지한다", () => {
  const rows = demoSummaryRows({
    ...demoPaymentSummary(),
    couponDiscount: 5_000,
    pointDiscount: 1_000,
  });
  assert.deepEqual(
    rows.order.map((row) => [row.label, row.amount]),
    [
      ["총 주문 금액", 219_900],
      ["ㄴ펀딩 금액", 219_900],
      ["ㄴ배송비", 0],
    ],
  );
  assert.deepEqual(
    rows.discount.map((row) => [row.label, row.amount]),
    [
      ["총 할인 금액", 26_900],
      ["ㄴ얼리버드 할인", 20_900],
      ["ㄴ쿠폰 사용", 5_000],
      ["ㄴ보유 적립금 사용", 1_000],
    ],
  );
  assert.equal(rows.finalAmount, 193_000);
});
