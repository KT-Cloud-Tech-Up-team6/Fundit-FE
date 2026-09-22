import test from "node:test";
import assert from "node:assert/strict";
import {
  parseResultParams,
  confirmOutcome,
  failureOutcome,
  createAttemptOutcome,
  isUserCancel,
  paymentWindowErrorMessage,
} from "./payment-result.ts";
import {
  rememberAttempt,
  recallAttempt,
  recallAttemptAmount,
  recallLastAttempt,
  markConfirmed,
  isConfirmed,
} from "./payment-attempt.ts";
import { ApiError } from "../../../shared/api/api-error.ts";

const apiError = (code, status) => new ApiError({ code, status, message: code });

test("successUrl 쿼리는 승인 요청으로, 금액은 양의 정수 문자열만 허용한다", () => {
  assert.deepEqual(
    parseResultParams({ paymentKey: "pk", orderId: "fundit-abc", amount: "73100" }),
    { kind: "confirm", paymentKey: "pk", orderId: "fundit-abc", amount: 73100 },
  );
  for (const amount of ["", "0", "-1", "1.5", "1e3", "abc", "99999999999999999999"])
    assert.equal(
      parseResultParams({ paymentKey: "pk", orderId: "fundit-abc", amount }).kind,
      "invalid",
      amount,
    );
  assert.equal(parseResultParams({ paymentKey: "pk", amount: "100" }).kind, "invalid");
  assert.equal(parseResultParams({ orderId: "fundit-abc", amount: "100" }).kind, "invalid");
});

test("failUrl 쿼리는 실패로, 쿼리가 없으면 none으로 해석한다", () => {
  assert.deepEqual(
    parseResultParams({ code: "REJECT_CARD_COMPANY", message: "거절", orderId: "fundit-abc" }),
    { kind: "fail", code: "REJECT_CARD_COMPANY", message: "거절", orderId: "fundit-abc" },
  );
  // Toss 문서: 사용자가 결제창을 닫으면 PAY_PROCESS_CANCELED이고 failUrl에 orderId가 오지 않는다.
  assert.deepEqual(parseResultParams({ code: "PAY_PROCESS_CANCELED", message: "취소" }), {
    kind: "fail",
    code: "PAY_PROCESS_CANCELED",
    message: "취소",
    orderId: undefined,
  });
  assert.equal(parseResultParams({}).kind, "none");
  assert.equal(parseResultParams({ orderId: "0198f2b1-2c3d-7a1e-9c4f-6a2b1e0d8f31" }).kind, "none");
  assert.equal(parseResultParams({ paymentKey: ["a", "b"] }).kind, "none");
  // Toss는 successUrl에 paymentType도 붙인다. 일반결제(NORMAL)는 그대로 승인한다.
  const success = { paymentKey: "pk", orderId: "fundit-abc", amount: "1" };
  assert.equal(parseResultParams({ paymentType: "NORMAL", ...success }).kind, "confirm");
  // 브랜드페이는 별도 승인 API가 필요한데 BE는 일반 승인만 제공하므로 승인 요청을 보내지 않는다.
  assert.equal(parseResultParams({ paymentType: "BRANDPAY", ...success }).kind, "invalid");
  const long = parseResultParams({ code: "X", message: "가".repeat(500) });
  assert.equal(long.message.length, 200);
});

test("승인 실패는 확정 오류만 재결제를 권하고 결과 불명은 확인을 먼저 안내한다", () => {
  for (const code of ["PAYMENT_AMOUNT_MISMATCH", "PAYMENT_EXPIRED"])
    assert.equal(confirmOutcome(apiError(code, 422)).next, "retry", code);
  assert.equal(confirmOutcome(apiError("PG_CONFIRM_FAILED", 422)).next, "recheck");
  assert.equal(confirmOutcome(apiError("PAYMENT_NOT_PENDING", 409)).next, "check");
  // BE가 ALREADY_PROCESSED_PAYMENT 등 Toss 4xx를 PG_CONFIRM_FAILED로 합치므로 미청구를 단정하지 않는다.
  assert.doesNotMatch(confirmOutcome(apiError("PG_CONFIRM_FAILED", 422)).message, /결제되지 않/);
  // 5xx·네트워크·파싱 실패는 승인 여부를 모른다: 같은 코드라도 재결제 금지.
  assert.equal(confirmOutcome(apiError("PG_CONFIRM_FAILED", 503)).next, "recheck");
  assert.equal(confirmOutcome(apiError("RESPONSE_PARSE_ERROR", 200)).next, "recheck");
  assert.equal(confirmOutcome(new TypeError("network")).next, "recheck");
});

test("BE 에러 코드는 enum 이름 그대로 오고 확정 실패만 승인 실패로 분기한다", () => {
  // modules/common ErrorCode.getCode()가 name()을 그대로 쓰므로 JSON code는 enum 이름이다.
  // PaymentErrorCode의 상태 코드와 짝이 맞는 것만 확정 실패로 다룬다.
  const codes = {
    FUNDING_NOT_PENDING: 409,
    PAYMENT_NOT_PENDING: 409,
    PAYMENT_AMOUNT_MISMATCH: 422,
    PAYMENT_EXPIRED: 410,
    PG_CONFIRM_FAILED: 422,
  };
  for (const [code, status] of Object.entries(codes))
    assert.notEqual(confirmOutcome(apiError(code, status)).message, "", code);
  // 코드는 같아도 상태가 5xx면 승인 여부를 모른다.
  for (const code of Object.keys(codes))
    assert.equal(confirmOutcome(apiError(code, 500)).next, "recheck", code);
  // 게이트웨이/공통 에러는 확정 분기에 들어가지 않는다.
  for (const code of ["TOKEN_EXPIRED", "DEPENDENCY_FAILURE", "NOT_FOUND", "HTTP_ERROR"])
    assert.equal(confirmOutcome(apiError(code, 503)).next, "recheck", code);
});

test("결제창 취소와 Toss 실패 메시지를 구분한다", () => {
  assert.equal(
    failureOutcome({ code: "PAY_PROCESS_CANCELED", message: "x" }).message,
    "결제를 취소했습니다.",
  );
  assert.equal(
    failureOutcome({ code: "REJECT_CARD_COMPANY", message: "한도 초과" }).message,
    "한도 초과",
  );
  assert.equal(failureOutcome({ code: "E", message: "" }).next, "retry");
  assert.equal(isUserCancel({ code: "USER_CANCEL" }), true);
  assert.equal(isUserCancel({ code: "PAY_PROCESS_CANCELED" }), true);
  assert.equal(isUserCancel(new Error("x")), false);
  assert.equal(isUserCancel(null), false);
  assert.equal(paymentWindowErrorMessage({ message: " PG unavailable " }), "PG unavailable");
  assert.equal(paymentWindowErrorMessage({ message: "" }), null);
  assert.equal(paymentWindowErrorMessage(null), null);
});

test("결제 시도 생성 오류 문구", () => {
  assert.match(createAttemptOutcome(apiError("FUNDING_NOT_PENDING", 409)), /결제할 수 없는 주문/);
  assert.match(createAttemptOutcome(apiError("FORBIDDEN", 403)), /본인/);
  assert.match(createAttemptOutcome(apiError("DEPENDENCY_FAILURE", 503)), /준비하지 못했/);
});

test("결제 시도·승인 표시는 저장소 접근이 실패해도 예외 없이 동작한다", () => {
  const values = new Map();
  const store = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  rememberAttempt(store, "fundit-abc", "order-uuid", 73100);
  assert.equal(recallAttempt(store, "fundit-abc"), "order-uuid");
  assert.equal(recallAttemptAmount(store, "fundit-abc"), 73100);
  assert.equal(recallAttempt(store, "other"), null);
  assert.equal(recallAttemptAmount(store, "other"), null);
  assert.equal(isConfirmed(store, "order-uuid"), false);
  markConfirmed(store, "order-uuid");
  assert.equal(isConfirmed(store, "order-uuid"), true);
  // 주문 상태 반영이 끝내 오지 않아도 승인 표시가 영구히 남아 재시도를 막지는 않는다.
  assert.equal(isConfirmed(store, "order-uuid", Date.now() + 2 * 60 * 60 * 1000), false);
  // 과거 형식("1")도 만료로 본다.
  store.setItem("fundit-payment-confirmed:legacy", "1");
  assert.equal(isConfirmed(store, "legacy"), false);
  // 취소로 orderId가 오지 않는 경우: 가장 최근 시도로 복원한다.
  assert.equal(recallLastAttempt(store), "order-uuid");
  rememberAttempt(store, "fundit-def", "order-2", 1000);
  assert.equal(recallLastAttempt(store), "order-2");
  assert.equal(recallAttempt(store, "fundit-abc"), "order-uuid");
  assert.equal(recallLastAttempt({ getItem: () => null, setItem: () => undefined }), null);

  const broken = {
    getItem: () => {
      throw new Error("blocked");
    },
    setItem: () => {
      throw new Error("blocked");
    },
  };
  rememberAttempt(broken, "fundit-abc", "order-uuid", 73100);
  markConfirmed(broken, "order-uuid");
  assert.equal(recallAttempt(broken, "fundit-abc"), null);
  assert.equal(recallAttemptAmount(broken, "fundit-abc"), null);
  assert.equal(recallLastAttempt(broken), null);
  assert.equal(isConfirmed(broken, "order-uuid"), false);
});
