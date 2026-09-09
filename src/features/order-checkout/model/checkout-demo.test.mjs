import assert from "node:assert/strict";
import test from "node:test";
import {
  clampPointUsage,
  demoPaymentSummary,
  demoTerms,
  finalPaymentAmount,
  formatWon,
  maxPointUsage,
  requiredTermsMet,
  totalDiscount,
  totalOrderAmount,
} from "./checkout-demo.ts";

test("금액은 천 단위 구분과 원 단위를 붙인다", () => {
  assert.equal(formatWon(699_000), "699,000원");
  assert.equal(formatWon(0), "0원");
});

test("총 주문 금액은 펀딩 금액 + 배송비", () => {
  assert.equal(totalOrderAmount({ fundingAmount: 699_000, shippingFee: 0 }), 699_000);
  assert.equal(totalOrderAmount({ fundingAmount: 699_000, shippingFee: 3_000 }), 702_000);
});

test("총 할인 금액은 쿠폰 + 적립금 사용액의 합", () => {
  assert.equal(totalDiscount({ couponDiscount: 4_000, pointDiscount: 1_000 }), 5_000);
});

test("최종 결제 금액은 총 주문 − 총 할인이고 음수면 0으로 막는다", () => {
  assert.equal(finalPaymentAmount(demoPaymentSummary()), 695_000); // 699,000 − 쿠폰 4,000 − 적립금 0
  assert.equal(
    finalPaymentAmount({
      fundingAmount: 1_000,
      shippingFee: 0,
      couponDiscount: 5_000,
      pointDiscount: 0,
    }),
    0,
  );
});

test("적립금 상쇄 가능액은 총 주문 − 쿠폰 할인", () => {
  // 총 주문 699,000 − 쿠폰 4,000 = 695,000
  assert.equal(maxPointUsage(demoPaymentSummary()), 695_000);
});

test("적립금 사용액은 [0, 보유잔액, 상쇄가능액] 범위로 잘리고 소수·음수·NaN을 정리한다", () => {
  assert.equal(clampPointUsage(3_000, 5_000, 695_000), 3_000);
  assert.equal(clampPointUsage(9_999, 5_000, 695_000), 5_000); // 보유 초과 → 잔액으로
  assert.equal(clampPointUsage(10, 5_000, 3), 3); // 상쇄가능액이 더 작으면 그쪽으로
  assert.equal(clampPointUsage(-100, 5_000, 695_000), 0);
  assert.equal(clampPointUsage(1_500.9, 5_000, 695_000), 1_500); // 정수화
  assert.equal(clampPointUsage(Number.NaN, 5_000, 695_000), 0);
});

test("적립금을 반영하면 최종 결제 금액이 그만큼 줄어든다", () => {
  const base = demoPaymentSummary(); // 최종 695,000 (적립금 0)
  assert.equal(finalPaymentAmount({ ...base, pointDiscount: 5_000 }), 690_000);
});

test("필수 약관이 전부 동의돼야 requiredTermsMet 이 true", () => {
  const terms = demoTerms();
  const requiredIds = terms.filter((term) => term.required).map((term) => term.id);

  assert.equal(requiredTermsMet(terms, []), false);
  assert.equal(requiredTermsMet(terms, requiredIds.slice(0, 2)), false);
  assert.equal(requiredTermsMet(terms, requiredIds), true);
  // 선택 약관은 조건에 영향을 주지 않는다.
  assert.equal(requiredTermsMet(terms, [...requiredIds, "news"]), true);
});
