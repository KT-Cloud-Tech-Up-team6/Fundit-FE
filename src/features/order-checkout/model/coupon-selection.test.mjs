import assert from "node:assert/strict";
import test from "node:test";
import { couponCodes, removeCoupon, selectCoupon } from "./coupon-selection.ts";

const platform0 = { couponCode: "PLATFORM-1", issuerType: "PLATFORM" };
const platform0Replacement = { couponCode: "PLATFORM-2", issuerType: "PLATFORM" };
const maker1 = { couponCode: "MAKER-1", issuerType: "MAKER" };

test("preserves page-zero platform selection while selecting a page-one maker", () => {
  const pageZeroSelection = selectCoupon([], platform0);
  const pageOneSelection = selectCoupon(pageZeroSelection, maker1);
  assert.deepEqual(couponCodes(pageOneSelection), ["PLATFORM-1", "MAKER-1"]);
  assert.deepEqual(couponCodes(pageOneSelection), ["PLATFORM-1", "MAKER-1"]);
});

test("replaces an issuer selected on another page without dropping the other issuer", () => {
  const selected = selectCoupon(selectCoupon([], platform0), maker1);
  assert.deepEqual(couponCodes(selectCoupon(selected, platform0Replacement)), [
    "MAKER-1",
    "PLATFORM-2",
  ]);
});

test("reopening while coupon data is loading retains the stored issuer and code", () => {
  const selected = selectCoupon(selectCoupon([], platform0), maker1);
  assert.deepEqual(couponCodes(selected), ["PLATFORM-1", "MAKER-1"]);
  assert.deepEqual(couponCodes(removeCoupon(selected, "PLATFORM-1")), ["MAKER-1"]);
});

test("does not select a coupon whose issuer metadata is unavailable", () => {
  assert.deepEqual(couponCodes(selectCoupon([], { couponCode: "UNKNOWN", issuerType: null })), []);
});
