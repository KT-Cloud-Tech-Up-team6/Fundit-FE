import assert from "node:assert/strict";
import test from "node:test";
import { consumeSocialAuthSession, saveSocialAuthSession } from "./social-auth-session.ts";

function stubSessionStorage(t) {
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
  return data;
}

const payload = {
  agreedTerms: ["SERVICE_USE", "PRIVACY"],
  entry: "signup",
  provider: "KAKAO",
  returnTo: "/",
  state: "state-1",
};

test("a saved social auth session is consumed exactly once", (t) => {
  stubSessionStorage(t);
  assert.equal(saveSocialAuthSession(payload), true);

  const first = consumeSocialAuthSession();
  assert.equal(first?.state, "state-1");
  assert.deepEqual(first?.agreedTerms, ["SERVICE_USE", "PRIVACY"]);
  assert.equal(first?.provider, "KAKAO");
  // 두 번째 읽기는 항상 비어 있어야 콜백 재실행이 같은 state를 다시 쓰지 못한다.
  assert.equal(consumeSocialAuthSession(), null);
});

test("an expired social auth session is discarded", (t) => {
  const data = stubSessionStorage(t);
  saveSocialAuthSession(payload);
  const stored = JSON.parse(data.get("fundit-auth-social"));
  data.set("fundit-auth-social", JSON.stringify({ ...stored, expiresAt: Date.now() - 1 }));

  assert.equal(consumeSocialAuthSession(), null);
  assert.equal(data.has("fundit-auth-social"), false);
});

test("a stored value with an unexpected shape is not trusted", (t) => {
  const data = stubSessionStorage(t);
  const valid = { ...payload, expiresAt: Date.now() + 60_000 };
  for (const broken of [
    { ...valid, provider: "NAVER" },
    { ...valid, state: "" },
    { ...valid, entry: "link" },
    { ...valid, agreedTerms: [1] },
    "not-an-object",
  ]) {
    data.set("fundit-auth-social", JSON.stringify(broken));
    assert.equal(consumeSocialAuthSession(), null);
  }
  data.set("fundit-auth-social", "{not json");
  assert.equal(consumeSocialAuthSession(), null);
});

test("saving reports failure when session storage is unavailable", (t) => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      setItem: () => {
        throw new Error("blocked");
      },
    },
  });
  t.after(() => {
    if (descriptor) Object.defineProperty(globalThis, "sessionStorage", descriptor);
    else delete globalThis.sessionStorage;
  });

  assert.equal(saveSocialAuthSession(payload), false);
});
