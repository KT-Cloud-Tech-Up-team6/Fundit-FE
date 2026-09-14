import assert from "node:assert/strict";
import test from "node:test";
import {
  addCancelPhotos,
  calculateRefund,
  canSubmitCancel,
  maxCancelPhotos,
  removeCancelPhoto,
} from "./funding-cancel.ts";

test("환불 계산은 수수료·적립금 없이 전액 환불한다", () => {
  assert.deepEqual(calculateRefund(599_000), {
    actualRefundAmount: 599_000,
    pointRefundAmount: 0,
    cancelFee: 0,
  });
});

test("취소 사유가 선택돼야 제출 가능하다", () => {
  assert.equal(canSubmitCancel(""), false);
  assert.equal(canSubmitCancel("   "), false);
  assert.equal(canSubmitCancel("단순 변심"), true);
});

test("사진 첨부는 한도를 넘지 않는 만큼만 받는다", () => {
  const photo = (id) => ({ id, url: `blob:${id}`, name: `${id}.jpg` });
  const current = Array.from({ length: maxCancelPhotos - 1 }, (_, i) => photo(`a${i}`));
  const next = addCancelPhotos(current, [photo("new1"), photo("new2")]);
  assert.equal(next.length, maxCancelPhotos);
  assert.equal(next.at(-1).id, "new1");
});

test("사진 삭제는 해당 id만 뺀다", () => {
  const photos = [
    { id: "1", url: "blob:1", name: "1.jpg" },
    { id: "2", url: "blob:2", name: "2.jpg" },
  ];
  assert.deepEqual(
    removeCancelPhoto(photos, "1").map((p) => p.id),
    ["2"],
  );
});
