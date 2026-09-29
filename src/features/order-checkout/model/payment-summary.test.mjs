import assert from "node:assert/strict";
import test from "node:test";
import { demoSummaryRows, previewSummaryRows } from "./payment-summary.ts";
import { demoPaymentSummary } from "./checkout-demo.ts";

test("실제 주문서 결제 금액은 펀딩 금액을 정가 합계로, 차액을 얼리버드 할인으로 두고 적립금 줄은 없다", () => {
  // BE #181: rewardAmount는 얼리 버드 할인가 합계, discountAmount는 쿠폰 할인이다.
  const rows = previewSummaryRows(
    {
      rewardAmount: 540_000,
      shippingFee: 3_000,
      discountAmount: 10_000,
      finalAmount: 533_000,
      appliedCoupons: [{ couponCode: "SAVE", issuerType: "PLATFORM", discountType: "AMOUNT" }],
    },
    600_000,
  );
  assert.deepEqual(rows, {
    order: [
      { label: "총 주문 금액", amount: 603_000 },
      { label: "ㄴ펀딩 금액", amount: 600_000 },
      { label: "ㄴ배송비", amount: 3_000 },
    ],
    discount: [
      { label: "총 할인 금액", amount: 70_000 },
      { label: "ㄴ얼리버드 할인", amount: 60_000 },
      { label: "ㄴ쿠폰 사용", amount: 10_000 },
    ],
    finalAmount: 533_000,
  });
  // 총 주문 금액 − 총 할인 금액이 BE 최종 결제 금액과 같다.
  assert.equal(rows.order[0].amount - rows.discount[0].amount, rows.finalAmount);
});

test("얼리 버드가 없으면 얼리버드 할인은 0원이고, 정가가 미리보기보다 낮게 오면 할인을 음수로 만들지 않는다", () => {
  const preview = {
    rewardAmount: 150_000,
    shippingFee: 3_000,
    discountAmount: 0,
    finalAmount: 153_000,
  };
  for (const listAmount of [150_000, 140_000]) {
    const rows = previewSummaryRows(preview, listAmount);
    assert.deepEqual(
      rows.order.map((row) => row.amount),
      [153_000, 150_000, 3_000],
    );
    assert.deepEqual(
      rows.discount.map((row) => row.amount),
      [0, 0, 0],
    );
  }
});

test("최종 결제 금액은 합계로 다시 계산하지 않고 BE finalAmount를 따른다", () => {
  const rows = previewSummaryRows(
    { rewardAmount: 10_000, shippingFee: 3_000, discountAmount: 20_000, finalAmount: 0 },
    10_000,
  );
  assert.equal(rows.finalAmount, 0);
  assert.deepEqual(
    rows.discount.map((row) => row.amount),
    [20_000, 0, 20_000],
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
