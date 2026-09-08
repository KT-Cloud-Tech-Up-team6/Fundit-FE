import assert from "node:assert/strict";
import test from "node:test";
import {
  addAmount,
  emptyReward,
  positiveInteger,
  rewardError,
  upsertReward,
} from "./basic-info-demo.ts";

test("목표 금액 증액은 정수 범위에서만 반영한다", () => {
  assert.equal(addAmount("", 500000), "500000");
  assert.equal(addAmount("500000", 100000), "600000");
  assert.equal(addAmount(String(Number.MAX_SAFE_INTEGER), 100000), String(Number.MAX_SAFE_INTEGER));
  for (const value of ["-1", "1.5", "abc", "", "0"]) assert.equal(positiveInteger(value), false);
});

test("리워드는 이름과 양의 정수 가격 및 제한 수량을 검증한다", () => {
  const draft = { ...emptyReward(), name: "  기본 패키지  ", price: "39000" };
  assert.equal(rewardError(draft), "");
  assert.notEqual(rewardError({ ...draft, name: " " }), "");
  assert.notEqual(rewardError({ ...draft, price: "-1" }), "");
  assert.notEqual(rewardError({ ...draft, limited: true, quantity: "0" }), "");
  assert.equal(rewardError({ ...draft, limited: true, quantity: "100" }), "");
});

test("리워드 수정은 중복 추가하지 않고 옵션과 제한 여부를 보존한다", () => {
  const draft = {
    ...emptyReward(),
    name: "패키지",
    price: "29000",
    earlyBird: true,
    options: true,
    limited: true,
    quantity: "100",
  };
  const added = upsertReward([], draft, 3);
  const edited = upsertReward(added, { ...draft, name: "수정", limited: false }, 3);
  assert.equal(edited.length, 1);
  assert.equal(edited[0].name, "수정");
  assert.equal(edited[0].quantity, "");
  assert.equal(edited[0].earlyBird, true);
  assert.equal(edited[0].options, true);
  assert.equal(added[0].name, "패키지");
  assert.equal(upsertReward(added, emptyReward(), 4), added);
});
