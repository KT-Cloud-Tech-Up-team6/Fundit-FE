import assert from "node:assert/strict";
import test from "node:test";
import { toOrderLines, toRewards } from "./public-reward.ts";
import { addOptionLine, pickedOption } from "./reward-demo.ts";

/* BE RewardConsumerResponse 모양. null 필드는 키가 빠진다. */
const rateEarlyBird = {
  rewardId: 11,
  rewardDisplayCode: "R-11",
  name: "얼리버드 스타터",
  description: "본체 · 브러시",
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
};
const amountEarlyBird = {
  rewardId: 12,
  rewardDisplayCode: "R-12",
  name: "정액 할인 세트",
  description: "세트 구성",
  price: 150_000,
  isEarlyBird: true,
  earlyBirdDiscountType: "AMOUNT",
  earlyBirdDiscountValue: 20_000,
  earlyBirdDiscountedPrice: 130_000,
  isLimited: false,
  options: [],
  soldOut: false,
};
const soldOut = {
  rewardId: 13,
  rewardDisplayCode: "R-13",
  name: "품절 세트",
  description: "품절",
  price: 99_000,
  isEarlyBird: false,
  isLimited: true,
  remainingStock: 0,
  options: [],
  soldOut: true,
};

test("얼리 버드 정률은 N% 배지, 정액은 비율 없이, 표시가는 할인가이고 정가는 취소선이다", () => {
  const [rate, amount, plain] = toRewards([rateEarlyBird, amountEarlyBird, soldOut]);
  assert.equal(rate.price, 180_000);
  assert.equal(rate.originalPrice, 200_000);
  assert.equal(rate.earlyBirdRate, 10);
  assert.equal(amount.price, 130_000);
  assert.equal(amount.originalPrice, 150_000);
  assert.equal(amount.earlyBirdRate, undefined);
  assert.equal(amount.isEarlyBird, true);
  assert.equal(plain.price, 99_000);
  assert.equal(plain.originalPrice, undefined);
});

test("API 리워드는 삽입 순서가 유지되는 문자열 키와 주문용 숫자 id를 함께 갖는다", () => {
  const [reward] = toRewards([rateEarlyBird]);
  assert.equal(reward.id, "reward-11");
  assert.equal(reward.rewardId, 11);
  assert.deepEqual(reward.perks, []);
  assert.deepEqual(reward.options[1], {
    groupName: "사이즈",
    values: [
      { label: "S", id: 201 },
      { label: "L", id: 202 },
    ],
  });
});

test("메타 줄은 설명이고, 설명이 없으면 빠진다", () => {
  const [rate, amount, plain] = toRewards([rateEarlyBird, amountEarlyBird, soldOut]);
  assert.deepEqual(rate.meta, ["본체 · 브러시"]);
  assert.deepEqual(amount.meta, ["세트 구성"]);
  assert.deepEqual(plain.meta, ["품절"]);
  assert.equal(plain.soldOut, true);
  assert.equal(plain.remainingStock, 0);
});

test("여러 옵션 그룹은 모두 고른 뒤에만 줄이 되고 값 id를 그룹 순서로 담는다", () => {
  const [reward] = toRewards([rateEarlyBird]);
  assert.equal(pickedOption(reward, [0, undefined]), null);
  assert.deepEqual(pickedOption(reward, [1, 1]), {
    value: "화이트 / L",
    optionValueIds: [102, 202],
  });
});

test("같은 리워드의 다른 옵션 조합은 별도 줄이고 주문 줄도 따로다", () => {
  const rewards = toRewards([rateEarlyBird, amountEarlyBird]);
  let lines = addOptionLine([], "블랙 / S", [101, 201]);
  lines = addOptionLine(lines, "화이트 / L", [102, 202]);
  lines = addOptionLine(lines, "블랙 / S", [101, 201]);
  const cart = { "reward-12": [{ value: null, quantity: 2 }], "reward-11": lines };
  assert.deepEqual(toOrderLines(rewards, cart), [
    { rewardId: 12, quantity: 2, optionValueIds: [] },
    { rewardId: 11, quantity: 2, optionValueIds: [101, 201] },
    { rewardId: 11, quantity: 1, optionValueIds: [102, 202] },
  ]);
});

test("응답에 없는 리워드 키는 주문 줄로 보내지 않는다", () => {
  const rewards = toRewards([amountEarlyBird]);
  assert.deepEqual(toOrderLines(rewards, { "reward-99": [{ value: null, quantity: 1 }] }), []);
});
