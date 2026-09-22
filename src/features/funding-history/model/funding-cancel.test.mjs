import assert from "node:assert/strict";
import test from "node:test";
import {
  addCancelPhotos,
  refundSubmissionFor,
  toRefundInfo,
  canSubmitCancel,
  maxCancelPhotos,
  removeCancelPhoto,
  returnDefaultsByQueryType,
  returnReasonsByType,
  returnTypes,
} from "./funding-cancel.ts";

test("예상 환불액은 서버 값을 그대로 옮기고 계약 없는 자리는 비운다", () => {
  assert.deepEqual(
    toRefundInfo({
      orderId: "0b7c8a91-3f45-4e7a-8d21-5c9e6a4b2f10",
      rewardAmount: 18_000,
      shippingFee: 5_000,
      discountAmount: 0,
      refundAmount: 23_000,
    }),
    { pointRefundAmount: null, shippingFee: 5_000, cancelFee: null, actualRefundAmount: 23_000 },
  );
});

test("하자 사유는 DefectType으로, 배송 지연은 전용 계약으로 간다", () => {
  assert.deepEqual(refundSubmissionFor("반품", "불량·하자"), {
    supported: true,
    kind: "defect",
    defectType: "DEFECTIVE",
  });
  assert.deepEqual(refundSubmissionFor("반품", "상품 파손"), {
    supported: true,
    kind: "defect",
    defectType: "DAMAGED",
  });
  assert.deepEqual(refundSubmissionFor("반품", "배송 지연"), {
    supported: true,
    kind: "shipping-delay",
  });
});

test("계약이 없는 조합은 이유와 함께 막힌다", () => {
  for (const reason of ["단순변심", "상품이 잘못 배송됨", "구성품 누락", "기타"]) {
    assert.equal(refundSubmissionFor("반품", reason).supported, false, reason);
  }
  for (const reason of returnReasonsByType["교환"]) {
    assert.deepEqual(refundSubmissionFor("교환", reason), {
      supported: false,
      reason: "교환 신청은 아직 제공되지 않습니다.",
    });
  }
});

test("취소 사유가 선택돼야 제출 가능하다", () => {
  assert.equal(canSubmitCancel(""), false);
  assert.equal(canSubmitCancel("   "), false);
  assert.equal(canSubmitCancel("단순 변심"), true);
});

test("사진 첨부는 한도를 넘지 않는 만큼만 받는다", () => {
  const photo = (id) => ({ id, url: `blob:${id}`, name: `${id}.jpg`, file: null });
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

test("반품/교환 사유는 유형별로 다르고, 교환에는 반품 전용 사유가 없다", () => {
  assert.deepEqual([...returnTypes], ["반품", "교환"]);
  assert.ok(returnReasonsByType["반품"].includes("배송 지연"));
  assert.ok(!returnReasonsByType["교환"].includes("배송 지연"));
  assert.ok(!returnReasonsByType["교환"].includes("단순변심"));
});

test("환불 신청 쿼리 타입은 반품 유형·사유로 매핑된다", () => {
  for (const [queryType, { returnType, reason }] of Object.entries(returnDefaultsByQueryType)) {
    assert.equal(returnType, "반품", queryType);
    assert.ok(returnReasonsByType[returnType].includes(reason), `${queryType} -> ${reason}`);
  }
});
