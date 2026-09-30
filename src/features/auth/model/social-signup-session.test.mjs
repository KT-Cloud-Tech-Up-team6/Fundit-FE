import assert from "node:assert/strict";
import test from "node:test";
import {
  clearSocialSignupSession,
  readSocialSignupSession,
  saveSocialSignupAgreedTerms,
  saveSocialSignupSession,
} from "./social-signup-session.ts";

const KEY = "fundit-auth-social-signup";

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
  agreedTerms: ["SERVICE_USE", "PRIVACY", "AGE_OVER_14"],
  email: "social@fundit.test",
  entry: "signup",
  name: "소셜 사용자",
  provider: "GOOGLE",
  signupToken: "signup-token-1",
};

test("the signup session can be read repeatedly until it is cleared", (t) => {
  stubSessionStorage(t);
  assert.equal(saveSocialSignupSession(payload), true);

  // 새로고침해도 폼이 이어지도록 읽어도 지우지 않는다.
  assert.equal(readSocialSignupSession()?.signupToken, "signup-token-1");
  assert.equal(readSocialSignupSession()?.provider, "GOOGLE");
  assert.deepEqual(readSocialSignupSession()?.agreedTerms, payload.agreedTerms);

  clearSocialSignupSession();
  assert.equal(readSocialSignupSession(), null);
});

test("a provider without an email keeps null so the form asks for it", (t) => {
  stubSessionStorage(t);
  saveSocialSignupSession({ ...payload, email: null, name: null, provider: "KAKAO" });

  const session = readSocialSignupSession();
  assert.equal(session?.email, null);
  assert.equal(session?.name, null);
});

test("an expired signup session is discarded and removed", (t) => {
  const data = stubSessionStorage(t);
  saveSocialSignupSession(payload);
  data.set(KEY, JSON.stringify({ ...JSON.parse(data.get(KEY)), expiresAt: Date.now() - 1 }));

  assert.equal(readSocialSignupSession(), null);
  assert.equal(data.has(KEY), false);
});

test("a stored value with an unexpected shape is not trusted", (t) => {
  const data = stubSessionStorage(t);
  const valid = { ...payload, expiresAt: Date.now() + 60_000 };
  for (const broken of [
    { ...valid, provider: "NAVER" },
    { ...valid, signupToken: "" },
    { ...valid, entry: "link" },
    { ...valid, agreedTerms: [1] },
    { ...valid, email: 3 },
    "not-an-object",
  ]) {
    data.set(KEY, JSON.stringify(broken));
    assert.equal(readSocialSignupSession(), null);
  }
  data.set(KEY, "{not json");
  assert.equal(readSocialSignupSession(), null);
});

test("agreed terms are appended to the existing session and survive a reload", (t) => {
  stubSessionStorage(t);
  saveSocialSignupSession({ ...payload, agreedTerms: [], entry: "login" });

  assert.equal(saveSocialSignupAgreedTerms(["SERVICE_USE", "PRIVACY"]), true);

  const session = readSocialSignupSession();
  assert.deepEqual(session?.agreedTerms, ["SERVICE_USE", "PRIVACY"]);
  assert.equal(session?.signupToken, "signup-token-1");
});

test("agreed terms cannot be saved without a session", (t) => {
  stubSessionStorage(t);
  assert.equal(saveSocialSignupAgreedTerms(["SERVICE_USE"]), false);
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

  assert.equal(saveSocialSignupSession(payload), false);
});
