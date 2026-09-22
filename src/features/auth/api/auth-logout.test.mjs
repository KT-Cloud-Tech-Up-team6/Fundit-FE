import assert from "node:assert/strict";
import test from "node:test";
import { revokeSession } from "./auth-api.ts";
import { authTokenStore } from "../../../shared/api/auth-token-store.ts";

test("로그아웃은 인증 헤더 없이 쿠키만으로 보낸다", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({
      url,
      method: options.method,
      headers: options.headers,
      credentials: options.credentials,
    });
    return Response.json({ message: "로그아웃되었습니다." });
  });
  const generation = authTokenStore.changeSession();
  // 만료 직전 Access Token이 남아 있어도 BE는 인증을 요구하지 않는다.
  authTokenStore.set("stale-access-token");
  try {
    await revokeSession(generation);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "/api/v1/auth/logout");
    assert.equal(calls[0].method, "POST");
    assert.equal(calls[0].credentials, "include");
    assert.equal(calls[0].headers.get("Authorization"), null);
  } finally {
    authTokenStore.clear();
  }
});

test("잠금을 기다리는 사이 새 로그인이 끝나면 그 세션의 쿠키를 지우지 않는다", async (t) => {
  let requests = 0;
  t.mock.method(globalThis, "fetch", async () => {
    requests++;
    return Response.json({ message: "로그아웃되었습니다." });
  });
  const generation = authTokenStore.changeSession();
  // 로그인·가입이 세션을 새로 열면 쿠키는 이미 새 세션의 것이다.
  authTokenStore.changeSession();

  await revokeSession(generation);
  assert.equal(requests, 0);
});

test("서버 폐기 실패를 성공으로 바꾸지 않고 로컬 토큰도 되살리지 않는다", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({ message: "잠시 후 다시 시도해 주세요." }, { status: 500 }),
  );
  const generation = authTokenStore.changeSession();

  await assert.rejects(revokeSession(generation), /다시 시도/);
  assert.equal(authTokenStore.get(), null);
});
