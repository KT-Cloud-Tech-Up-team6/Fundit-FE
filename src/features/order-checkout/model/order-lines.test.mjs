import assert from "node:assert/strict";
import test from "node:test";
import { isOrderable } from "./order-lines.ts";

const colorSize = {
  rewardId: 11,
  name: "컬러 세트",
  price: 200_000,
  isEarlyBird: false,
  isLimited: true,
  remainingStock: 3,
  soldOut: false,
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
};
/* BE는 재고를 모르면 remainingStock 키를 뺀다. */
const noStock = {
  rewardId: 12,
  name: "기본 세트",
  price: 150_000,
  isEarlyBird: false,
  isLimited: false,
  soldOut: false,
  options: [],
};
const soldOut = { ...noStock, rewardId: 13, soldOut: true, remainingStock: 0 };
const rewards = [colorSize, noStock, soldOut];
const line = (rewardId, quantity, optionValueIds = []) => ({ rewardId, quantity, optionValueIds });

test("같은 리워드 옵션 줄들의 수량 합이 재고를 넘으면 주문할 수 없다", () => {
  assert.equal(isOrderable([line(11, 2, [101, 202]), line(11, 2, [102, 201])], rewards), false);
  assert.equal(isOrderable([line(11, 2, [101, 202]), line(11, 1, [102, 201])], rewards), true);
  assert.equal(isOrderable([line(11, 3, [101, 202])], rewards), true);
});

test("재고 정보가 없는 리워드는 수량 합을 제한하지 않는다", () => {
  assert.equal(isOrderable([line(12, 50), line(11, 1, [101, 201])], rewards), true);
});

test("품절, 없는 리워드, 옵션을 덜 고른 줄, 없는 옵션 값은 주문할 수 없다", () => {
  assert.equal(isOrderable([line(13, 1)], rewards), false);
  assert.equal(isOrderable([line(99, 1)], rewards), false);
  assert.equal(isOrderable([line(11, 1, [101])], rewards), false);
  assert.equal(isOrderable([line(11, 1, [101, 999])], rewards), false);
  assert.equal(isOrderable([line(11, 0, [101, 201])], rewards), false);
});

test("줄이 없거나 리워드를 아직 받지 못했으면 주문할 수 없다", () => {
  assert.equal(isOrderable([], rewards), false);
  assert.equal(isOrderable([line(12, 1)], undefined), false);
});
