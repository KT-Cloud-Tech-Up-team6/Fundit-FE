import assert from "node:assert/strict";
import test from "node:test";
import { ApiError } from "../../../shared/api/api-error.ts";
import { RefundEvidenceValidationError } from "../../../entities/refund/api/refund-request-api.ts";
import {
  acceptsDetailInput,
  addCancelPhotos,
  cancelDetailMaxLengthFor,
  cancelErrorMessage,
  cancelReasons,
  cancelRequestBody,
  canSubmitCancel,
  estimateParamsFor,
  maxCancelPhotos,
  refundInfoFor,
  refundReasons,
  refundRequestErrorMessage,
  removeCancelPhoto,
  requiresEvidence,
  returnRequestTargetFor,
  returnTypes,
  toFundingCancelDetail,
} from "./funding-cancel.ts";

const estimate = {
  orderId: "0b7c8a91-3f45-4e7a-8d21-5c9e6a4b2f10",
  paymentAmount: 23_000,
  rewardAmount: 23_000,
  shippingFee: 0,
  discountAmount: 0,
  returnShippingFee: 0,
  additionalPaymentAmount: 0,
  refundAmount: 23_000,
  confirmed: true,
};

test("드롭다운 옵션은 Figma 09-25 순서를 따른다", () => {
  assert.deepEqual(
    [...cancelReasons],
    ["단순 변심", "결제 정보 오류", "옵션 선택 오류", "기타 창작자 귀책", "기타"],
  );
  assert.deepEqual([...returnTypes], ["교환", "반품"]);
  assert.equal(refundReasons.length, 8);
});

test("취소 사유는 BE cancelReason으로 보내고 입력은 앞뒤 공백을 지운다", () => {
  assert.deepEqual(cancelRequestBody("단순 변심", ""), { cancelReason: "SIMPLE_CHANGE_OF_MIND" });
  assert.deepEqual(cancelRequestBody("결제 정보 오류", "  카드 오류 "), {
    cancelReason: "PAYMENT_INFO_ERROR",
    reasonDetail: "카드 오류",
  });
  assert.deepEqual(cancelRequestBody("옵션 선택 오류", ""), {
    cancelReason: "OPTION_SELECTION_ERROR",
  });
  assert.deepEqual(cancelRequestBody("기타", "주소 변경"), {
    cancelReason: "ETC",
    reasonDetail: "주소 변경",
  });
});

test("임시 처리: 기타 창작자 귀책은 ETC에 '창작자 귀책'을 붙여 보내고 입력은 선택이다", () => {
  assert.deepEqual(cancelRequestBody("기타 창작자 귀책", "   "), {
    cancelReason: "ETC",
    reasonDetail: "창작자 귀책",
  });
  assert.deepEqual(cancelRequestBody("기타 창작자 귀책", " 옵션이 바뀌었어요 "), {
    cancelReason: "ETC",
    reasonDetail: "창작자 귀책 · 옵션이 바뀌었어요",
  });
  assert.equal(canSubmitCancel("기타 창작자 귀책", ""), true);
});

test("상세 한도는 BE 100자이고, 기타 창작자 귀책은 앞 문구를 붙여도 100자를 넘지 않는다", () => {
  assert.equal(cancelDetailMaxLengthFor("단순 변심"), 100);
  assert.equal(cancelDetailMaxLengthFor("기타"), 100);
  const room = cancelDetailMaxLengthFor("기타 창작자 귀책");
  assert.equal(room, 91);
  assert.equal(cancelRequestBody("기타 창작자 귀책", "가".repeat(room)).reasonDetail.length, 100);
});

test("임시 처리: 발송 지연 취소만 입력란이 없다", () => {
  assert.equal(acceptsDetailInput("shipping-delay"), false);
  assert.equal(acceptsDetailInput("cancel"), true);
  assert.equal(acceptsDetailInput("return"), true);
});

test("취소는 사유가 있어야 하고 기타는 상세 내용도 있어야 한다", () => {
  assert.equal(canSubmitCancel("", ""), false);
  assert.equal(canSubmitCancel("단순 변심", ""), true);
  assert.equal(canSubmitCancel("기타", "   "), false);
  assert.equal(canSubmitCancel("기타", "사유"), true);
});

test("반품은 구매자 귀책이면 /return, 그 밖은 /defect로 간다", () => {
  assert.deepEqual(returnRequestTargetFor("반품", "단순 변심"), {
    kind: "return",
    returnReason: "CHANGE_OF_MIND",
  });
  assert.deepEqual(returnRequestTargetFor("반품", "옵션 선택 오류"), {
    kind: "return",
    returnReason: "WRONG_OPTION",
  });
  const defects = {
    "불량·하자": "DEFECTIVE",
    "상품 파손": "DAMAGED",
    "상품이 잘못 배송됨": "WRONG_DELIVERY",
    "구성품 누락": "MISSING_COMPONENTS",
    "상품 설명과 다름": "DIFFERENT_FROM_DESCRIPTION",
    기타: "OTHER",
  };
  for (const [reason, defectType] of Object.entries(defects)) {
    assert.deepEqual(
      returnRequestTargetFor("반품", reason),
      { kind: "defect", defectType },
      reason,
    );
  }
});

test("교환은 8개 사유를 모두 exchangeReason 코드로 보낸다", () => {
  const codes = refundReasons.map((reason) => returnRequestTargetFor("교환", reason));
  assert.deepEqual(
    codes.map((target) => target.kind),
    Array(8).fill("exchange"),
  );
  assert.deepEqual(
    codes.map((target) => target.exchangeReason),
    [
      "CHANGE_OF_MIND",
      "WRONG_OPTION",
      "DEFECTIVE",
      "DAMAGED",
      "WRONG_DELIVERY",
      "MISSING_COMPONENTS",
      "DIFFERENT_FROM_DESCRIPTION",
      "OTHER",
    ],
  );
});

test("증빙은 하자 반품만 필수다", () => {
  assert.equal(requiresEvidence(returnRequestTargetFor("반품", "불량·하자")), true);
  assert.equal(requiresEvidence(returnRequestTargetFor("반품", "기타")), true);
  assert.equal(requiresEvidence(returnRequestTargetFor("반품", "단순 변심")), false);
  assert.equal(requiresEvidence(returnRequestTargetFor("교환", "불량·하자")), false);
  assert.equal(requiresEvidence(null), false);
});

test("예상 금액 조회 조건은 신청 유형·사유를 그대로 넘긴다", () => {
  assert.deepEqual(estimateParamsFor({ kind: "return", returnReason: "WRONG_OPTION" }), {
    triggerType: "RETURN_CHANGE_OF_MIND",
  });
  assert.deepEqual(estimateParamsFor({ kind: "defect", defectType: "OTHER" }), {
    triggerType: "DEFECT",
    defectType: "OTHER",
  });
  assert.deepEqual(estimateParamsFor({ kind: "exchange", exchangeReason: "DAMAGED" }), {
    triggerType: "EXCHANGE",
    exchangeReason: "DAMAGED",
  });
});

const values = (view) => [
  ...view.rows.map((row) => `${row.label}=${row.value}`),
  `${view.total.label}=${view.total.value}`,
];

test("취소 환불 정보는 결제 금액과 서버 예상 환불액이고 적립금 행이 없다", () => {
  const view = refundInfoFor({ kind: "cancel" }, estimate);
  assert.equal(view.title, "환불 정보");
  assert.deepEqual(values(view), ["결제 금액=23,000원", "예상 환불액=23,000원"]);
  assert.equal(view.notice, "");
});

test("반품 금액 행은 귀책에 따라 서버 값·창작자 부담·안내 문구로 나뉜다", () => {
  const buyer = refundInfoFor(
    { kind: "return", returnReason: "CHANGE_OF_MIND" },
    { ...estimate, returnShippingFee: 5_000, refundAmount: 18_000 },
  );
  assert.deepEqual(values(buyer), [
    "결제 금액=23,000원",
    "반품 배송비=-5,000원",
    "예상 환불액=18,000원",
  ]);
  assert.equal(buyer.notice, "");

  const creator = refundInfoFor(
    { kind: "defect", defectType: "DAMAGED" },
    { ...estimate, confirmed: false },
  );
  assert.deepEqual(values(creator), [
    "결제 금액=23,000원",
    "반품 배송비=창작자 부담 예정",
    "예상 환불액=23,000원",
  ]);
  assert.match(creator.notice, /반품 배송비 5,000원이 청구될 수 있어요/);

  /* BE는 null인 refundAmount를 JSON에서 뺀다. */
  const withoutRefund = { ...estimate };
  delete withoutRefund.refundAmount;
  const other = refundInfoFor({ kind: "defect", defectType: "OTHER" }, withoutRefund);
  assert.deepEqual(values(other), [
    "결제 금액=23,000원",
    "반품 배송비=접수 후 확인하여 안내",
    "예상 환불액=접수 후 확인하여 안내",
  ]);
});

test("교환은 결제 정보로 추가 결제 금액을 보여 주고 금액을 FE에서 만들지 않는다", () => {
  const buyer = refundInfoFor(
    { kind: "exchange", exchangeReason: "CHANGE_OF_MIND" },
    { ...estimate, refundAmount: null, additionalPaymentAmount: 5_000 },
  );
  assert.equal(buyer.title, "결제 정보");
  assert.deepEqual(values(buyer), ["교환 배송비=5,000원", "추가 결제 금액=5,000원"]);

  const creator = refundInfoFor(
    { kind: "exchange", exchangeReason: "MISSING_COMPONENTS" },
    { ...estimate, refundAmount: null, confirmed: false },
  );
  assert.deepEqual(values(creator), ["교환 배송비=창작자 부담 예정", "추가 결제 금액=0원"]);
  assert.match(creator.notice, /교환 배송비 5,000원이 청구될 수 있어요/);

  const other = refundInfoFor(
    { kind: "exchange", exchangeReason: "OTHER" },
    { ...estimate, refundAmount: null, confirmed: false },
  );
  assert.deepEqual(values(other), [
    "교환 배송비=접수 후 확인하여 안내",
    "추가 결제 금액=접수 후 확인하여 안내",
  ]);
  assert.equal(other.notice, "");
});

test("신청 거절 코드는 안내 문구로 바꾸고 모르는 오류는 기본 문구를 쓴다", () => {
  const apiError = (status, code) => new ApiError({ status, code, message: "서버 문구" });
  assert.equal(
    refundRequestErrorMessage(apiError(409, "RETURN_PERIOD_EXPIRED")),
    "반품·교환 가능 기간이 지났습니다.",
  );
  assert.match(refundRequestErrorMessage(apiError(409, "NOT_DELIVERED")), /배송이 완료된 뒤/);
  assert.match(
    refundRequestErrorMessage(apiError(409, "REFUND_ALREADY_REQUESTED")),
    /이미 접수된 반품·교환 신청/,
  );
  assert.match(
    refundRequestErrorMessage(apiError(422, "RETURN_FEE_EXCEEDS_AMOUNT")),
    /반품 배송비\(5,000원\)보다 적어/,
  );
  assert.match(refundRequestErrorMessage(apiError(503, "DEPENDENCY_FAILURE")), /잠시 후/);
  assert.equal(
    refundRequestErrorMessage(new RefundEvidenceValidationError("사진 오류")),
    "사진 오류",
  );
  assert.equal(
    refundRequestErrorMessage(new Error("network")),
    "신청을 접수하지 못했습니다. 잠시 후 다시 시도해주세요.",
  );

  assert.equal(
    cancelErrorMessage(apiError(422, "ORDER_NOT_CANCELLABLE")),
    "펀딩이 종료되어 취소할 수 없습니다.",
  );
  assert.match(cancelErrorMessage(apiError(410, "RESOURCE_EXPIRED")), /만료된 주문/);
  assert.match(cancelErrorMessage(apiError(422, "NOT_YET_DELAYED")), /발송 예정일이 지나지 않아/);
  assert.match(cancelErrorMessage(new Error("network")), /주문 상태를 다시 확인/);
});

test("상품 카드는 첫 리워드와 옵션, 나머지 건수를 한 줄로 보여 준다", () => {
  const order = {
    thumbnailUrl: null,
    projectTitle: "콜라겐 크림",
    finalAmount: 23_000,
    lineItems: [
      {
        rewardName: "콜라겐 크림",
        quantity: 2,
        options: [{ optionGroupName: "용량", optionValue: "50ml" }],
      },
      { rewardName: "선크림", quantity: 1, options: [] },
    ],
  };
  assert.deepEqual(toFundingCancelDetail(order), {
    imageSrc: "",
    projectTitle: "콜라겐 크림",
    rewardOption: "콜라겐 크림 · 용량 50ml 외 1건",
    rewardQuantity: 2,
    amount: 23_000,
  });
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
