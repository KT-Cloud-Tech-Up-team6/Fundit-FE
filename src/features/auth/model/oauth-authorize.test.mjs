import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAuthorizeUrl,
  isSocialAuthAvailable,
  parseProviderSlug,
  redirectPath,
  startSocialAuth,
} from "./oauth-authorize.ts";
import { consumeSocialAuthSession } from "./social-auth-session.ts";

const KEYS = [
  "NEXT_PUBLIC_KAKAO_CLIENT_ID",
  "NEXT_PUBLIC_GOOGLE_CLIENT_ID",
  "NEXT_PUBLIC_MSW_ENABLED",
];

function withEnv(t, env) {
  const previous = Object.fromEntries([...KEYS, "NODE_ENV"].map((key) => [key, process.env[key]]));
  for (const key of KEYS) delete process.env[key];
  Object.assign(process.env, env);
  t.after(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
}

function stubBrowser(t) {
  const data = new Map();
  const assigned = [];
  const originals = ["sessionStorage", "window"].map((name) => [
    name,
    Object.getOwnPropertyDescriptor(globalThis, name),
  ]);
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => data.set(key, value),
      removeItem: (key) => data.delete(key),
    },
  });
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { location: { assign: (url) => assigned.push(url), origin: "https://app.example" } },
  });
  t.after(() => {
    for (const [name, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  });
  return assigned;
}

test("the Kakao authorize URL follows the documented parameters and omits scope", (t) => {
  withEnv(t, { NEXT_PUBLIC_KAKAO_CLIENT_ID: "kakao-key" });
  const url = new URL(
    buildAuthorizeUrl({ origin: "https://app.example", provider: "KAKAO", state: "s1" }),
  );

  assert.equal(`${url.origin}${url.pathname}`, "https://kauth.kakao.com/oauth/authorize");
  assert.equal(url.searchParams.get("client_id"), "kakao-key");
  assert.equal(url.searchParams.get("redirect_uri"), "https://app.example/oauth/kakao");
  assert.equal(url.searchParams.get("response_type"), "code");
  assert.equal(url.searchParams.get("state"), "s1");
  assert.equal(url.searchParams.has("scope"), false);
});

test("the Google authorize URL requests openid, email and profile", (t) => {
  withEnv(t, { NEXT_PUBLIC_GOOGLE_CLIENT_ID: "google-id" });
  const url = new URL(
    buildAuthorizeUrl({ origin: "http://localhost:3000", provider: "GOOGLE", state: "s2" }),
  );

  assert.equal(`${url.origin}${url.pathname}`, "https://accounts.google.com/o/oauth2/v2/auth");
  assert.equal(url.searchParams.get("redirect_uri"), "http://localhost:3000/oauth/google");
  assert.equal(url.searchParams.get("scope"), "openid email profile");
  assert.equal(url.searchParams.get("state"), "s2");
});

test("without a client ID there is no authorize URL and the button stays unavailable", (t) => {
  withEnv(t, { NODE_ENV: "production" });
  assert.equal(buildAuthorizeUrl({ origin: "https://a.b", provider: "KAKAO", state: "s" }), null);
  assert.equal(isSocialAuthAvailable("KAKAO"), false);
  assert.equal(isSocialAuthAvailable("GOOGLE"), false);
});

test("mock mode needs development plus an explicit MSW flag", (t) => {
  withEnv(t, { NEXT_PUBLIC_MSW_ENABLED: "true", NODE_ENV: "production" });
  assert.equal(isSocialAuthAvailable("KAKAO"), false);
  withEnv(t, { NEXT_PUBLIC_MSW_ENABLED: "true", NODE_ENV: "development" });
  assert.equal(isSocialAuthAvailable("KAKAO"), true);
});

test("provider slugs map both ways and reject everything else", () => {
  assert.equal(parseProviderSlug("kakao"), "KAKAO");
  assert.equal(parseProviderSlug("google"), "GOOGLE");
  assert.equal(parseProviderSlug("KAKAO"), null);
  assert.equal(parseProviderSlug("naver"), null);
  assert.equal(redirectPath("KAKAO"), "/oauth/kakao");
  assert.equal(redirectPath("GOOGLE"), "/oauth/google");
});

test("starting social auth stores the same state it sends to the provider", (t) => {
  withEnv(t, { NEXT_PUBLIC_KAKAO_CLIENT_ID: "kakao-key" });
  const assigned = stubBrowser(t);

  const started = startSocialAuth({
    agreedTerms: ["SERVICE_USE"],
    entry: "signup",
    provider: "KAKAO",
    returnTo: "https://evil.example/steal",
  });

  assert.equal(started, true);
  assert.equal(assigned.length, 1);
  const sentState = new URL(assigned[0]).searchParams.get("state");
  const session = consumeSocialAuthSession();
  assert.equal(session?.state, sentState);
  assert.equal(session?.entry, "signup");
  assert.deepEqual(session?.agreedTerms, ["SERVICE_USE"]);
  // 열린 리다이렉트를 막기 위해 허용되지 않은 returnTo는 홈으로 바뀐다.
  assert.equal(session?.returnTo, "/");
});

test("mock mode goes straight to the callback with a mock authorization code", (t) => {
  withEnv(t, { NEXT_PUBLIC_MSW_ENABLED: "true", NODE_ENV: "development" });
  const assigned = stubBrowser(t);

  assert.equal(
    startSocialAuth({
      agreedTerms: [],
      entry: "login",
      provider: "GOOGLE",
      returnTo: "/my/orders",
    }),
    true,
  );

  const url = new URL(assigned[0], "https://app.example");
  assert.equal(url.pathname, "/oauth/google");
  assert.equal(url.searchParams.get("code"), "mock-existing");
  const session = consumeSocialAuthSession();
  assert.equal(url.searchParams.get("state"), session?.state);
  assert.equal(session?.returnTo, "/my/orders");
});

test("nothing is sent to the provider when the state cannot be stored", (t) => {
  withEnv(t, { NEXT_PUBLIC_KAKAO_CLIENT_ID: "kakao-key" });
  const assigned = stubBrowser(t);
  globalThis.sessionStorage.setItem = () => {
    throw new Error("blocked");
  };

  assert.equal(
    startSocialAuth({ agreedTerms: [], entry: "login", provider: "KAKAO", returnTo: "/" }),
    false,
  );
  assert.equal(assigned.length, 0);
});
