import assert from "node:assert/strict";
import test from "node:test";
import {
  clearIdentityRecoverySessionIfCurrent,
  consumeIdentityRecoverySession,
  saveIdentityRecoverySession,
} from "./auth-flow-session.ts";

test("a stale identity verification completion preserves the latest recovery session", (t) => {
  const data = new Map();
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => data.set(key, value),
      removeItem: (key) => data.delete(key),
    },
  });
  t.after(() => {
    if (descriptor) Object.defineProperty(globalThis, "sessionStorage", descriptor);
    else delete globalThis.sessionStorage;
  });

  let latestRunId = 1;
  const firstRunIsCurrent = () => latestRunId === 1;
  saveIdentityRecoverySession({
    agreedTerms: ["terms"],
    identityDraft: { name: "첫 인증", birthDate: "1990-01-01", phoneNumber: "01011112222" },
  });

  latestRunId = 2;
  saveIdentityRecoverySession({
    agreedTerms: ["terms"],
    identityDraft: { name: "새 인증", birthDate: "1991-01-01", phoneNumber: "01033334444" },
  });

  // 이전 요청의 늦은 성공과 실패는 같은 정리 경로를 거친다.
  clearIdentityRecoverySessionIfCurrent(firstRunIsCurrent);
  clearIdentityRecoverySessionIfCurrent(firstRunIsCurrent);

  assert.equal(consumeIdentityRecoverySession()?.identityDraft.name, "새 인증");
});

test("the current identity verification completion clears its recovery session", (t) => {
  const data = new Map();
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => data.set(key, value),
      removeItem: (key) => data.delete(key),
    },
  });
  t.after(() => {
    if (descriptor) Object.defineProperty(globalThis, "sessionStorage", descriptor);
    else delete globalThis.sessionStorage;
  });

  saveIdentityRecoverySession({
    agreedTerms: ["terms"],
    identityDraft: { name: "현재 인증", birthDate: "1990-01-01", phoneNumber: "01011112222" },
  });

  clearIdentityRecoverySessionIfCurrent(() => true);

  assert.equal(consumeIdentityRecoverySession(), null);
});
