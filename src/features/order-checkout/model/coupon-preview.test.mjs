import assert from "node:assert/strict";
import test from "node:test";
import { couponPreviewError } from "./coupon-preview.ts";
import { getCheckoutCoupons, previewOrder } from "../../../entities/order/api/order-api.ts";
import { authTokenStore } from "../../../shared/api/auth-token-store.ts";

test("서버가 적용을 확인한 쿠폰만 승인하고 누락·거절 응답은 차단한다", () => {
  const preview = {
    finalAmount: 17000,
    appliedCoupons: [{ couponCode: "SAVE", discountAmount: 3000 }],
  };
  assert.equal(couponPreviewError(preview, "SAVE"), "");
  assert.equal(couponPreviewError({}, null), "");
  assert.notEqual(couponPreviewError({}, "SAVE"), "");
  assert.notEqual(couponPreviewError(preview, "OTHER"), "");
  assert.match(
    couponPreviewError(
      { ...preview, unavailableCoupons: [{ couponCode: "SAVE", reason: "EXPIRED" }] },
      "SAVE",
    ),
    /기간/,
  );
});

test("최소 금액·소유권·예산·알 수 없는 거절 사유를 안내한다", () => {
  for (const reason of [
    "MIN_AMOUNT_NOT_MET",
    "NOT_OWNED",
    "BUDGET_EXCEEDED",
    "NOT_FOUND",
    "ALREADY_USED",
    "NOT_APPLICABLE",
    "NEW_REASON",
  ]) {
    assert.notEqual(
      couponPreviewError({ unavailableCoupons: [{ couponCode: "SAVE", reason }] }, "SAVE"),
      "",
    );
  }
});

test("인증된 쿠폰함 페이지와 선택·해제 미리보기는 BE 계약으로 요청한다", async (t) => {
  authTokenStore.set("test-coupon");
  t.after(() => authTokenStore.clear());
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    calls.push({ url, init });
    return Response.json({ content: [], hasNext: false });
  });
  await getCheckoutCoupons(1);
  const body = { projectId: "project", lineItems: [], shippingAddress: {}, couponCodes: ["SAVE"] };
  await previewOrder(body);
  await previewOrder({ ...body, couponCodes: [] });
  assert.equal(calls[0].url, "/api/v1/coupons/me?page=1&size=20&status=AVAILABLE");
  assert.equal(calls[0].init.headers.get("Authorization"), "Bearer test-coupon");
  assert.equal(calls[1].url, "/api/v1/orders/preview");
  assert.deepEqual(JSON.parse(calls[1].init.body).couponCodes, ["SAVE"]);
  assert.deepEqual(JSON.parse(calls[2].init.body).couponCodes, []);
});
