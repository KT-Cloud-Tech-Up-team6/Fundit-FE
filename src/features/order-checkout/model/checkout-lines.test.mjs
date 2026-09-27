import assert from "node:assert/strict";
import test from "node:test";
import { checkoutLineItems } from "./checkout-lines.ts";
import { toRewards } from "../../reward-selection/model/public-reward.ts";

/* BE RewardConsumerResponse 모양. null 필드는 키가 빠진다. */
const rewards = toRewards(
  [
    {
      rewardId: 11,
      rewardDisplayCode: "R-11",
      name: "얼리버드 컬러 세트",
      description: "본체 · 브러시 2종",
      price: 200_000,
      isEarlyBird: true,
      earlyBirdDiscountType: "RATE",
      earlyBirdDiscountValue: 10,
      earlyBirdDiscountedPrice: 180_000,
      isLimited: true,
      remainingStock: 3,
      options: [
        {
          groupId: 1,
          groupName: "색상",
          values: [
            { valueId: 101, value: "블랙" },
            { valueId: 102, value: "화이트" },
          ],
        },
        {
          groupId: 2,
          groupName: "사이즈",
          values: [
            { valueId: 201, value: "S" },
            { valueId: 202, value: "L" },
          ],
        },
      ],
      soldOut: false,
      shippingFee: 0,
      estimatedDeliveryDays: 7,
    },
    {
      rewardId: 12,
      rewardDisplayCode: "R-12",
      name: "기본 세트",
      description: "본체",
      price: 150_000,
      isEarlyBird: false,
      isLimited: false,
      options: [],
      soldOut: false,
    },
  ],
  "2026-10-27T14:59:59Z",
);

test("옵션 줄마다 리워드명·옵션·수량, 예상 발송일, 청구 기준(정가) 단가×수량을 만든다", () => {
  const items = checkoutLineItems(
    [
      { rewardId: 11, quantity: 1, optionValueIds: [101, 202] },
      { rewardId: 11, quantity: 2, optionValueIds: [102, 201] },
      { rewardId: 12, quantity: 3, optionValueIds: [] },
    ],
    rewards,
  );
  assert.deepEqual(items, [
    {
      label: "얼리버드 컬러 세트 · 블랙 / L · 1개",
      expectedShipping: "예상 발송일 2026.11.03",
      price: 200_000,
    },
    {
      label: "얼리버드 컬러 세트 · 화이트 / S · 2개",
      expectedShipping: "예상 발송일 2026.11.03",
      price: 400_000,
    },
    {
      label: "기본 세트 · 3개",
      expectedShipping: undefined,
      price: 450_000,
    },
  ]);
});

test("조회 결과에 없는 리워드 줄은 이름·금액 없이 수량만 알린다", () => {
  assert.deepEqual(
    checkoutLineItems([{ rewardId: 99, quantity: 2, optionValueIds: [] }], rewards),
    [{ label: "찾을 수 없는 리워드 · 2개" }],
  );
});
