import assert from "node:assert/strict";
import test from "node:test";
import { demoSummaryRows, previewSummaryRows } from "./payment-summary.ts";
import { demoPaymentSummary } from "./checkout-demo.ts";

test("실제 주문서 결제 금액은 BE 미리보기 값을 그대로 쓰고 얼리버드·적립금 줄을 두지 않는다", () => {
  const rows = previewSummaryRows({
    rewardAmount: 560_000,
    shippingFee: 3_000,
    discountAmount: 10_000,
    finalAmount: 553_000,
    appliedCoupons: [{ couponCode: "SAVE", issuerType: "PLATFORM", discountType: "AMOUNT" }],
  });
  assert.deepEqual(rows, {
    order: [
      { label: "총 주문 금액", amount: 563_000 },
      { label: "ㄴ펀딩 금액", amount: 560_000 },
      { label: "ㄴ배송비", amount: 3_000 },
    ],
    discount: [
      { label: "총 할인 금액", amount: 10_000 },
      { label: "ㄴ쿠폰 사용", amount: 10_000 },
    ],
    finalAmount: 553_000,
  });
});

test("최종 결제 금액은 합계로 다시 계산하지 않고 BE finalAmount를 따른다", () => {
  const rows = previewSummaryRows({
    rewardAmount: 10_000,
    shippingFee: 3_000,
    discountAmount: 20_000,
    finalAmount: 0,
  });
  assert.equal(rows.finalAmount, 0);
  assert.deepEqual(
    rows.discount.map((row) => row.amount),
    [20_000, 20_000],
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
