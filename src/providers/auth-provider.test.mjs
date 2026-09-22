import assert from "node:assert/strict";
import test from "node:test";

import { getRestoredUser, restoreAccessToken } from "./auth-provider.tsx";
import { authTokenStore } from "../shared/api/auth-token-store.ts";

const json = (body, status = 200) => new Response(JSON.stringify(body), { status });

test("session recovery does not retry after a newer session supersedes it during backoff", async (t) => {
  const superseded = { current: false };
  let refreshRequests = 0;
  t.mock.method(globalThis, "fetch", async () => {
    refreshRequests++;
    return json({}, 503);
  });

  await assert.rejects(
    restoreAccessToken(superseded, async () => {
      superseded.current = true;
    }),
    { name: "AbortError" },
  );
  assert.equal(refreshRequests, 1);
});

test("a final 401 from getMe clears the restored session", async (t) => {
  authTokenStore.set("restored-token");
  let memberRequests = 0;
  t.mock.method(globalThis, "fetch", async (url) => {
    if (url.endsWith("/token/refresh")) return json({ accessToken: "refreshed-token" });
    memberRequests++;
    return json({}, 401);
  });

  await assert.rejects(getRestoredUser(), { status: 401 });
  assert.equal(memberRequests, 2);
  assert.equal(authTokenStore.get(), null);
});
