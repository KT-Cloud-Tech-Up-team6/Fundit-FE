import assert from "node:assert/strict";
import test from "node:test";
import { apiRequest, refreshOnce } from "./client.ts";
import { authTokenStore } from "./auth-token-store.ts";
import { refreshAccessToken } from "../../features/auth/api/auth-api.ts";

function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
const json = (body, status = 200) => new Response(JSON.stringify(body), { status });

test("session restore and concurrent 401 requests share one refresh", async (t) => {
  authTokenStore.clear();
  const pending = deferred();
  let refreshes = 0;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    if (url.endsWith("/token/refresh")) {
      refreshes++;
      await pending.promise;
      return json({ accessToken: "fresh" });
    }
    return new Headers(options.headers).get("Authorization") === "Bearer fresh"
      ? json({ ok: true })
      : json({}, 401);
  });
  const restore = refreshAccessToken();
  const requests = [
    apiRequest("/protected", { auth: true }),
    apiRequest("/protected", { auth: true }),
  ];
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(refreshes, 1);
  pending.resolve();
  assert.deepEqual(await restore, { accessToken: "fresh" });
  assert.deepEqual(await Promise.all(requests), [{ ok: true }, { ok: true }]);
});

for (const action of ["clear", "replace"]) {
  test("pending refresh cannot overwrite a session after " + action, async (t) => {
    const pending = deferred();
    t.mock.method(globalThis, "fetch", async () => {
      await pending.promise;
      return json({ accessToken: "stale" });
    });
    const refresh = refreshOnce();
    if (action === "clear") authTokenStore.clear();
    else authTokenStore.set("other-account");
    const rejected = assert.rejects(refresh, { name: "AbortError" });
    pending.resolve();
    await rejected;
    assert.equal(authTokenStore.get(), action === "clear" ? null : "other-account");
  });
}

test("an old refresh failure does not clear a newer account", async (t) => {
  const pending = deferred();
  t.mock.method(globalThis, "fetch", async () => {
    await pending.promise;
    return json({}, 401);
  });
  const refresh = refreshOnce();
  authTokenStore.set("new-account");
  const rejected = assert.rejects(refresh);
  pending.resolve();
  await rejected;
  assert.equal(authTokenStore.get(), "new-account");
});

for (const status of [401, 503]) {
  test("refresh failure handles status " + status, async (t) => {
    authTokenStore.set("existing");
    t.mock.method(globalThis, "fetch", async () => json({}, status));
    await assert.rejects(refreshOnce());
    assert.equal(authTokenStore.get(), status === 401 ? null : "existing");
  });
}

function mockLocks(t, request) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { locks: { request } },
  });
  t.after(() =>
    descriptor
      ? Object.defineProperty(globalThis, "navigator", descriptor)
      : delete globalThis.navigator,
  );
}

test("refresh waits for the cross-tab lock before sending a rotating cookie", async (t) => {
  authTokenStore.clear();
  const available = deferred();
  let requests = 0;
  let lockName;
  mockLocks(t, async (name, run) => {
    lockName = name;
    await available.promise;
    return run();
  });
  t.mock.method(globalThis, "fetch", async () => {
    requests++;
    return json({ accessToken: "rotated" });
  });
  const first = refreshOnce(),
    second = refreshOnce();
  assert.equal(requests, 0);
  available.resolve();
  assert.deepEqual(await Promise.all([first, second]), ["rotated", "rotated"]);
  assert.equal(requests, 1);
  assert.equal(lockName, "fundit-auth-refresh");
});

test("a session changed while waiting for another tab does not send refresh", async (t) => {
  const available = deferred();
  mockLocks(t, async (_, run) => {
    await available.promise;
    return run();
  });
  const fetch = t.mock.method(globalThis, "fetch", async () => json({ accessToken: "wrong" }));
  const refresh = refreshOnce();
  authTokenStore.set("new-account");
  const rejected = assert.rejects(refresh, { name: "AbortError" });
  available.resolve();
  await rejected;
  assert.equal(fetch.mock.callCount(), 0);
  assert.equal(authTokenStore.get(), "new-account");
});
