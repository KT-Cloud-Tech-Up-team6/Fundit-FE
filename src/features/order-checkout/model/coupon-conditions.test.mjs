import assert from "node:assert/strict";
import test from "node:test";
import { couponConditions } from "./coupon-conditions.ts";

const base = {
  couponCode: "SAVE",
  couponName: "할인",
  discountType: "AMOUNT",
  discountValue: 3000,
  status: "AVAILABLE",
  expiresAt: "2026-09-30T15:00:00Z",
  minFundingAmount: 50000,
  perMemberLimit: 2,
  targetScope: "ALL",
  targetRefId: null,
};

test("coupon explains minimum reward funding, issuance limit and Korean expiry time", () => {
  const result = couponConditions(base, "project");
  assert.equal(
    result.condition,
    "50,000원 이상 펀딩 시 사용 가능\n전체 프로젝트\n1인당 최대 2장 발급",
  );
  assert.match(result.expiry, /2026.*10.*01.*00:00.*한국 시간/);
});

test("target scope uses the BE category name and known current project relationship", () => {
  const condition = (targetScope, targetRefId) =>
    couponConditions({ ...base, targetScope, targetRefId }, "project").condition;
  assert.match(condition("PROJECT", "project"), /현재 프로젝트 전용/);
  assert.match(condition("PROJECT", "another-uuid"), /다른 프로젝트 전용/);
  assert.match(condition("CATEGORY", "푸드"), /푸드 카테고리 전용/);
  assert.match(condition("MAKER", "seller-uuid"), /지정 판매자의 프로젝트 전용/);
  assert.doesNotMatch(condition("MAKER", "seller-uuid"), /seller-uuid/);
  assert.match(condition("CATEGORY", null), /적용 대상 확인 필요/);
  assert.match(condition("NEW_SCOPE", null), /적용 대상 확인 필요/);
});

test("zero minimum is unrestricted but missing coupon metadata is not unlimited", () => {
  assert.match(
    couponConditions({ ...base, minFundingAmount: 0 }, "p").condition,
    /최소 펀딩 금액 제한 없음/,
  );
  for (const minFundingAmount of [undefined, null, -1, NaN, 1.5, Number.MAX_SAFE_INTEGER + 1])
    assert.match(
      couponConditions({ ...base, minFundingAmount }, "p").condition,
      /최소 펀딩 금액 확인 필요/,
    );
  const missing = couponConditions(
    {
      ...base,
      minFundingAmount: 0,
      perMemberLimit: 0,
      targetScope: null,
      targetRefId: null,
      expiresAt: null,
    },
    "p",
  );
  assert.match(missing.condition, /인당 발급 한도 확인 필요/);
  assert.match(missing.condition, /최소 펀딩 금액 확인 필요/);
  assert.match(missing.condition, /적용 대상 확인 필요/);
  assert.equal(missing.expiry, "유효기간 확인 필요");
  assert.equal(
    couponConditions({ ...base, expiresAt: "bad-date" }, "p").expiry,
    "유효기간 확인 필요",
  );
});
