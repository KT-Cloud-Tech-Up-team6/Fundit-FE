import assert from "node:assert/strict";
import test from "node:test";
import {
  formatPhone,
  isValidPhone,
  nicknameSchema,
  normalizePhoneInput,
  passwordSchema,
  safeReturnTo,
  validRecoveryIdentity,
} from "./auth-input.ts";
import { consumeEmailRecoverySession, saveEmailRecoverySession } from "./email-recovery-session.ts";

test("login returns only to allowed internal routes and preserves checkout/search queries", () => {
  for (const input of [
    null,
    [],
    ["/my"],
    "https://evil.test/my",
    "//evil.test/my",
    "/\\evil.test",
    "/%2f%2fevil.test",
    "/auth/login",
    "/api/v1/auth",
    "/my/../../auth/login",
    "/my\n",
  ])
    assert.equal(safeReturnTo(input), "/");
  for (const input of [
    "/my",
    "/seller/projects",
    "/search?q=%ED%8E%80%EB%94%A9",
    "/funding/uuid/checkout?items=%5B%5D#address",
    "/payment/result?orderId=0f1e2d3c-4b5a-6978-8a9b-0c1d2e3f4a5b",
  ])
    assert.equal(safeReturnTo(input), input);
});

test("recovery phone formatting and password policy match signup", () => {
  assert.equal(formatPhone("01012345678"), "010-1234-5678");
  assert.equal(formatPhone("0111234567"), "011-123-4567");
  assert.equal(validRecoveryIdentity("홍길동", "010-1234-5678"), true);
  assert.equal(validRecoveryIdentity(" ", "010-1234-5678"), false);
  assert.equal(validRecoveryIdentity("홍길동", "010123"), false);
  for (const password of ["Abc123!x", "abcdef1!"])
    assert.equal(passwordSchema.safeParse(password).success, true);
  for (const password of ["Ab1!", "abcdefgh", "abc12345", "가나다abc12"])
    assert.equal(passwordSchema.safeParse(password).success, false);
});

test("email recovery callback requires a matching, unexpired, single-use session", (t) => {
  const data = new Map();
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      getItem: (key) => data.get(key),
      setItem: (key, value) => data.set(key, value),
      removeItem: (key) => data.delete(key),
    },
  });
  t.after(() => {
    if (descriptor) Object.defineProperty(globalThis, "sessionStorage", descriptor);
    else delete globalThis.sessionStorage;
  });
  const session = {
    identityVerificationId: "request-1",
    name: "홍길동",
    phoneNumber: "01012345678",
  };
  saveEmailRecoverySession(session);
  assert.equal(consumeEmailRecoverySession("different"), null);
  saveEmailRecoverySession(session);
  assert.equal(consumeEmailRecoverySession("request-1").name, "홍길동");
  assert.equal(consumeEmailRecoverySession("request-1"), null);
  saveEmailRecoverySession(session);
  const now = Date.now();
  t.mock.method(Date, "now", () => now + 600001);
  assert.equal(consumeEmailRecoverySession("request-1"), null);
});

test("phone input keeps digits only, at most 11, and validates domestic mobile numbers", () => {
  assert.equal(normalizePhoneInput("010-1234-5678"), "01012345678");
  assert.equal(normalizePhoneInput("0101234567890123"), "01012345678");
  assert.equal(normalizePhoneInput("abc"), "");
  for (const valid of ["01012345678", "0111234567"]) assert.equal(isValidPhone(valid), true);
  for (const invalid of [
    "",
    "1012345678",
    "010123456",
    "010-1234-5678",
    "02012345678",
    "010123456789",
  ])
    assert.equal(isValidPhone(invalid), false);
  // 복구 화면은 하이픈을 허용하는 기존 동작을 그대로 유지한다.
  assert.equal(validRecoveryIdentity("홍길동", "010-1234-5678"), true);
  assert.equal(validRecoveryIdentity(" ", "01012345678"), false);
});

test("nickname is trimmed and limited to 1 to 50 characters", () => {
  assert.equal(nicknameSchema.parse("  펀딧러  "), "펀딧러");
  assert.equal(nicknameSchema.safeParse("   ").success, false);
  assert.equal(nicknameSchema.safeParse("").success, false);
  assert.equal(nicknameSchema.safeParse("가".repeat(50)).success, true);
  assert.equal(nicknameSchema.safeParse("가".repeat(51)).success, false);
});
