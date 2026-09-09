import assert from "node:assert/strict";
import test from "node:test";
import {
  addOptionLine,
  calcCartTotal,
  calcTotal,
  demoRewards,
  formatWon,
  initialLines,
  isCartSubmittable,
} from "./reward-demo.ts";

test("금액은 천 단위 구분과 원 단위를 붙인다", () => {
  assert.equal(formatWon(599_000), "599,000원");
  assert.equal(formatWon(1_320_000), "1,320,000원");
});

test("총액은 가격 × 수량이고 수량은 최소 1로 본다", () => {
  assert.equal(calcTotal({ price: 599_000 }, 1), 599_000);
  assert.equal(calcTotal({ price: 599_000 }, 3), 1_797_000);
  assert.equal(calcTotal({ price: 599_000 }, 0), 599_000);
});

test("담을 때 초기 줄: 옵션 없으면 수량 1 한 줄, 옵션 있으면 빈 목록", () => {
  assert.deepEqual(initialLines({ options: [] }), [{ value: null, quantity: 1 }]);
  assert.deepEqual(initialLines({ options: [{ groupName: "색상", values: ["블랙"] }] }), []);
});

test("옵션 줄 추가: 새 값은 줄을 만들고, 같은 값은 기존 줄 수량 +1", () => {
  let lines = addOptionLine([], "블랙");
  assert.deepEqual(lines, [{ value: "블랙", quantity: 1 }]);

  lines = addOptionLine(lines, "화이트");
  assert.deepEqual(lines, [
    { value: "블랙", quantity: 1 },
    { value: "화이트", quantity: 1 },
  ]);

  lines = addOptionLine(lines, "블랙");
  assert.deepEqual(lines, [
    { value: "블랙", quantity: 2 },
    { value: "화이트", quantity: 1 },
  ]);
});

test("장바구니 총액은 담은 모든 줄의 가격 × 수량 합이다", () => {
  const rewards = demoRewards();
  assert.equal(calcCartTotal(rewards, {}), 0);

  // 얼리버드(599,000): 블랙 1 + 화이트 2 = 3개
  assert.equal(
    calcCartTotal(rewards, {
      "reward-early-bird": [
        { value: "블랙", quantity: 1 },
        { value: "화이트", quantity: 2 },
      ],
    }),
    599_000 * 3,
  );

  // + 디럭스(789,000) 수량 1
  assert.equal(
    calcCartTotal(rewards, {
      "reward-early-bird": [{ value: "블랙", quantity: 1 }],
      "reward-deluxe": [{ value: null, quantity: 1 }],
    }),
    599_000 + 789_000,
  );
});

test("펀딩하기는 1건 이상 담기고 담은 리워드마다 줄이 1개 이상일 때만 활성", () => {
  assert.equal(isCartSubmittable({}), false);
  // 옵션 리워드를 담기만 하고 줄이 없으면 비활성
  assert.equal(isCartSubmittable({ "reward-early-bird": [] }), false);
  assert.equal(isCartSubmittable({ "reward-early-bird": [{ value: "블랙", quantity: 1 }] }), true);
  // 옵션 없는 리워드는 담으면 줄이 자동으로 생겨 충족, 줄 없는 리워드가 섞이면 다시 비활성
  assert.equal(isCartSubmittable({ "reward-deluxe": [{ value: null, quantity: 1 }] }), true);
  assert.equal(
    isCartSubmittable({
      "reward-deluxe": [{ value: null, quantity: 1 }],
      "reward-standard": [],
    }),
    false,
  );
});

test("목업 리워드는 고유 id를 가지고 얼리버드 항목만 정가·비율을 갖는다", () => {
  const rewards = demoRewards();
  const ids = rewards.map((reward) => reward.id);
  assert.equal(new Set(ids).size, ids.length);

  const earlyBird = rewards.find((reward) => reward.isEarlyBird);
  assert.ok(earlyBird);
  assert.equal(earlyBird.originalPrice, 699_000);
  assert.equal(earlyBird.earlyBirdRate, 14);
});
