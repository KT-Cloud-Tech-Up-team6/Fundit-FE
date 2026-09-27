import assert from "node:assert/strict";
import test from "node:test";
import { sellerNotEstablishedMessage } from "./fulfillment-api-state.ts";

test("트래커가 없는 판매자 제작·배송 탭은 펀딩 실패와 성립 전을 나눠 안내한다", () => {
  assert.equal(
    sellerNotEstablishedMessage("FAILED"),
    "펀딩이 성립되지 않아 제작·배송을 진행하지 않아요.",
  );
  for (const status of ["ONGOING", "DRAFT", undefined])
    assert.equal(
      sellerNotEstablishedMessage(status),
      "펀딩이 성립되면 제작·배송 현황을 기록할 수 있어요.",
    );
});
