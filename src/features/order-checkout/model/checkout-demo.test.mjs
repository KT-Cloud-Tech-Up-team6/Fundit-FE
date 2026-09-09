import assert from "node:assert/strict";
import test from "node:test";
import {
  demoPaymentSummary,
  demoTerms,
  finalPaymentAmount,
  formatWon,
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
  assert.equal(finalPaymentAmount(demoPaymentSummary()), 694_000);
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

test("필수 약관이 전부 동의돼야 requiredTermsMet 이 true", () => {
  const terms = demoTerms();
  const requiredIds = terms.filter((term) => term.required).map((term) => term.id);

  assert.equal(requiredTermsMet(terms, []), false);
  assert.equal(requiredTermsMet(terms, requiredIds.slice(0, 2)), false);
  assert.equal(requiredTermsMet(terms, requiredIds), true);
  // 선택 약관은 조건에 영향을 주지 않는다.
  assert.equal(requiredTermsMet(terms, [...requiredIds, "news"]), true);
});
