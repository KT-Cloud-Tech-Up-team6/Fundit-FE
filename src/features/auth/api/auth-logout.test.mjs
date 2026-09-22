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
  /* 실패 응답이 토큰을 되돌리지 않는지 보려면 값이 남아 있는 상태에서 시작해야 한다.
     changeSession 직후를 그대로 확인하면 무엇을 바꾸든 항상 통과한다. */
  authTokenStore.set("stale-access-token");

  try {
    await assert.rejects(revokeSession(generation), /다시 시도/);
    assert.equal(authTokenStore.get(), "stale-access-token");
  } finally {
    authTokenStore.clear();
  }
});

test("응답하지 않는 폐기 요청은 상한에 걸려 잠금을 놓는다", async (t) => {
  /* 로그인·refresh가 같은 잠금을 쓰므로 여기서 매달리면 이후 로그인까지 막힌다. */
  let abortName = null;
  t.mock.method(
    globalThis,
    "fetch",
    (_url, options) =>
      new Promise((_resolve, reject) => {
        options.signal.addEventListener("abort", () => {
          abortName = options.signal.reason?.name ?? "aborted";
          reject(options.signal.reason);
        });
      }),
  );
  const generation = authTokenStore.changeSession();

  await assert.rejects(revokeSession(generation));
  assert.equal(abortName, "TimeoutError");
});
