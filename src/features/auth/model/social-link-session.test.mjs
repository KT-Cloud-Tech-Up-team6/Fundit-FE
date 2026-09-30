import assert from "node:assert/strict";
import test from "node:test";

import {
  clearSocialLinkSession,
  getSocialLinkSession,
  saveSocialLinkSession,
} from "./social-link-session.ts";

function installSessionStorage(t) {
  const data = new Map();
  globalThis.sessionStorage = {
    getItem: (key) => data.get(key) ?? null,
    removeItem: (key) => data.delete(key),
    setItem: (key, value) => data.set(key, value),
  };
  t.after(() => Reflect.deleteProperty(globalThis, "sessionStorage"));
  return data;
}

test("link token is kept in session storage for the social-link route", (t) => {
  const data = installSessionStorage(t);
  assert.equal(
    saveSocialLinkSession({ linkToken: "link-token", provider: "KAKAO", returnTo: "/my/fundings" }),
    true,
  );
  assert.equal(data.has("fundit-auth-social-link"), true);
  assert.deepEqual(getSocialLinkSession(), {
    expiresAt: JSON.parse(data.get("fundit-auth-social-link")).expiresAt,
    linkToken: "link-token",
    provider: "KAKAO",
    returnTo: "/my/fundings",
  });
});

test("the expected PortOne verification ID survives mobile redirect recovery", (t) => {
  installSessionStorage(t);
  saveSocialLinkSession({
    identityVerificationId: "portone-request-id",
    linkToken: "link-token",
    provider: "KAKAO",
    returnTo: "/",
  });
  assert.equal(getSocialLinkSession()?.identityVerificationId, "portone-request-id");
});

test("expired, malformed, and unsafe social-link sessions are discarded or narrowed", (t) => {
  const data = installSessionStorage(t);
  data.set(
    "fundit-auth-social-link",
    JSON.stringify({ expiresAt: Date.now() - 1, linkToken: "x", provider: "KAKAO", returnTo: "/" }),
  );
  assert.equal(getSocialLinkSession(), null);
  assert.equal(data.has("fundit-auth-social-link"), false);

  data.set("fundit-auth-social-link", "not-json");
  assert.equal(getSocialLinkSession(), null);

  data.set(
    "fundit-auth-social-link",
    JSON.stringify({
      expiresAt: Date.now() + 60_000,
      linkToken: "x",
      provider: "GOOGLE",
      returnTo: "https://evil.example",
    }),
  );
  assert.equal(getSocialLinkSession()?.returnTo, "/");
  clearSocialLinkSession();
  assert.equal(data.has("fundit-auth-social-link"), false);
});
