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
