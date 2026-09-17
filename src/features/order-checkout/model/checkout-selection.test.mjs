import assert from "node:assert/strict";
import test from "node:test";
import { checkoutItems, checkoutSummary } from "./checkout-selection.ts";
import {
  couponDiscountAmount,
  demoCoupons,
  finalPaymentAmount,
  maxPointUsage,
  clampPointUsage,
} from "./checkout-demo.ts";
import { designRewards } from "../../reward-selection/model/reward-demo.ts";
const rewards = designRewards();
const project = { title: "테스트 프로젝트", image: "/images/checkout/product.png" };
test("누적 선택 순서와 수량을 주문서에 전달하고 판매가로 합산한다", () => {
  const items = checkoutItems(
    rewards,
    {
      [rewards[2].id]: [{ value: null, quantity: 1 }],
      [rewards[0].id]: [{ value: null, quantity: 2 }],
    },
    project,
  );
  assert.deepEqual(
    items.map(({ rewardName, quantity }) => [rewardName, quantity]),
    [
      [rewards[2].name, 1],
      [rewards[0].name, 2],
    ],
  );
  assert.equal(items[0].projectTitle, project.title);
  const summary = checkoutSummary(items);
  assert.equal(summary.shippingFee, 0);
  assert.equal(finalPaymentAmount(summary), 667_000);
});
test("스타터 무료배송에 쿠폰과 적립금을 한 번씩 차감한다", () => {
  const summary = checkoutSummary(
    checkoutItems(rewards, { [rewards[0].id]: [{ value: null, quantity: 1 }] }, project),
  );
  assert.equal(summary.fundingAmount, 219_900);
  assert.equal(summary.earlyBirdDiscount, 20_900);
  const sale = finalPaymentAmount(summary);
  const coupons = demoCoupons();
  assert.equal(
    couponDiscountAmount(
      coupons.find((c) => c.id === "flat-3000"),
      sale,
    ),
    0,
  );
  const couponDiscount = couponDiscountAmount(
    coupons.find((c) => c.id === "flat-10000"),
    sale,
  );
  const withCoupon = { ...summary, couponDiscount };
  const pointDiscount = clampPointUsage(5000, 5000, maxPointUsage(withCoupon));
  assert.equal(finalPaymentAmount({ ...withCoupon, pointDiscount }), 184_000);
});
test("알 수 없는 리워드와 유효하지 않은 수량은 주문서에서 제외한다", () => {
  assert.deepEqual(
    checkoutItems(
      rewards,
      {
        missing: [{ value: null, quantity: 1 }],
        [rewards[0].id]: [
          { value: null, quantity: 0 },
          { value: null, quantity: 1.5 },
        ],
      },
      project,
    ),
    [],
  );
});
