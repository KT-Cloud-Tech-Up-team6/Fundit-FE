import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { createContext, runInContext } from "node:vm";
import ts from "typescript";
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

// 각 탭은 자체 모듈 캐시·전역 객체를 사용한다. localStorage만 공유하며 storage 이벤트를
// 일부러 전달하지 않아, 이벤트 지연 중에도 직접 세대 확인이 안전한지 검증한다.
function independentTab(storage, fetch, locks) {
  const modules = new Map();
  const root = dirname(fileURLToPath(import.meta.url));
  const context = createContext({
    Response,
    Headers,
    DOMException,
    console,
    process: { env: {} },
    crypto: { randomUUID },
    fetch,
    navigator: { locks },
    window: {
      localStorage: {
        getItem: (key) => storage.get(key) ?? null,
        setItem: (key, value) => storage.set(key, value),
      },
    },
  });
  function load(path) {
    if (modules.has(path)) return modules.get(path).exports;
    const loadedModule = { exports: {} };
    modules.set(path, loadedModule);
    const code = ts.transpileModule(readFileSync(path, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const require = (name) =>
      load(
        name.startsWith("@/")
          ? resolve(root, "../..", name.slice(2) + ".ts")
          : resolve(dirname(path), name + ".ts"),
      );
    runInContext(`(function(require, module, exports) {${code}\n})`, context)(
      require,
      loadedModule,
      loadedModule.exports,
    );
    return loadedModule.exports;
  }
  return {
    client: load(resolve(root, "client.ts")),
    store: load(resolve(root, "auth-token-store.ts")).authTokenStore,
    api: load(resolve(root, "../../features/auth/api/auth-api.ts")),
  };
}

for (const phase of ["waiting", "in-flight"]) {
  test(`another tab account change discards ${phase} refresh without a storage event`, async () => {
    const storage = new Map(),
      available = deferred(),
      response = deferred();
    let requests = 0;
    const first = independentTab(
      storage,
      async () => {
        requests++;
        await response.promise;
        return json({ accessToken: "other-account-token" });
      },
      phase === "waiting"
        ? {
            request: async (_, run) => {
              await available.promise;
              return run();
            },
          }
        : undefined,
    );
    const other = independentTab(storage, async () => json({}));
    first.store.changeSession();
    first.store.set("original-account");
    const refresh = first.client.refreshOnce();
    const rejected = assert.rejects(refresh, { name: "AbortError" });
    other.store.changeSession();
    other.store.set("new-account");
    available.resolve();
    response.resolve();
    await rejected;
    assert.equal(requests, phase === "waiting" ? 0 : 1);
    assert.equal(first.store.get(), null);
    assert.equal(other.store.get(), "new-account");
    assert.equal(storage.size, 1);
    assert.ok([...storage.values()].every((value) => !value.includes("account")));
  });
}

test("same-account refresh in another context retains the first tab session", async () => {
  const storage = new Map();
  const first = independentTab(storage, async () => json({}));
  const other = independentTab(storage, async () => json({ accessToken: "rotated" }));
  first.store.changeSession();
  first.store.set("original");
  const generation = first.store.getSessionGeneration();
  await other.client.refreshOnce();
  assert.equal(first.store.get(), "original");
  assert.equal(first.store.getSessionGeneration(), generation);
});

for (const status of [200, 401]) {
  test(`old protected response (${status}) cannot retry or return data after another tab changes account`, async () => {
    const storage = new Map(),
      response = deferred();
    let requests = 0;
    const first = independentTab(storage, async () => {
      requests++;
      await response.promise;
      return json({ secret: "previous user" }, status);
    });
    const other = independentTab(storage, async () => json({}));
    first.store.changeSession();
    first.store.set("previous");
    const request = first.client.apiRequest("/private", { auth: true });
    const rejected = assert.rejects(request, { name: "AbortError" });
    other.store.changeSession();
    response.resolve();
    await rejected;
    assert.equal(requests, 1);
    assert.equal(first.store.get(), null);
  });
}

test("login and refresh share the cross-tab cookie lock and invalidate queued old work", async () => {
  const storage = new Map(),
    releaseLogin = deferred(),
    loginStarted = deferred();
  let tail = Promise.resolve(),
    refreshes = 0;
  const locks = {
    request: (_, run) => {
      const next = tail.then(run);
      tail = next.catch(() => {});
      return next;
    },
  };
  const first = independentTab(
    storage,
    async () => {
      refreshes++;
      return json({ accessToken: "wrong-account" });
    },
    locks,
  );
  const other = independentTab(
    storage,
    async () => {
      loginStarted.resolve();
      await releaseLogin.promise;
      return json({ accessToken: "new-account", mustChangePassword: false });
    },
    locks,
  );
  first.store.changeSession();
  first.store.set("old-account");
  const login = other.api.login({ email: "fixture@example.com", password: "fixture" });
  const refresh = first.client.refreshOnce();
  const rejected = assert.rejects(refresh, { name: "AbortError" });
  await loginStarted.promise;
  assert.equal(first.store.get(), null);
  releaseLogin.resolve();
  await login;
  await rejected;
  assert.equal(refreshes, 0);
  assert.equal(other.store.get(), "new-account");
});

for (const method of ["signup", "login", "loginSocial", "signupSocial", "linkSocial"]) {
  test(`${method} publishes a new session before its request and installs the result`, async () => {
    const storage = new Map();
    const first = independentTab(storage, async () => json({}));
    first.store.changeSession();
    first.store.set("previous");
    const other = independentTab(storage, async () => {
      assert.equal(first.store.get(), null);
      return json({ accessToken: "next" });
    });
    await other.api[method]({});
    assert.equal(other.store.get(), "next");
  });
}

test("a late authentication result cannot revive a cleared session", async () => {
  const storage = new Map(),
    response = deferred();
  const tab = independentTab(storage, async () => {
    await response.promise;
    return json({ accessToken: "stale-login" });
  });
  const login = tab.api.login({});
  const rejected = assert.rejects(login, { name: "AbortError" });
  tab.store.changeSession();
  response.resolve();
  await rejected;
  assert.equal(tab.store.get(), null);
});

for (const failingOperation of ["get", "set"]) {
  test(`blocked storage ${failingOperation} retains local session protection`, async () => {
    const storage = new Map();
    storage[failingOperation] = () => {
      throw new DOMException("Storage blocked", "SecurityError");
    };
    const response = deferred();
    const tab = independentTab(storage, async (url) => {
      if (url.endsWith("/login")) return json({ accessToken: "local-login" });
      await response.promise;
      return json({ accessToken: "stale-refresh" });
    });
    await tab.api.login({});
    assert.equal(tab.store.get(), "local-login");
    const refresh = tab.client.refreshOnce();
    const rejected = assert.rejects(refresh, { name: "AbortError" });
    tab.store.changeSession();
    response.resolve();
    await rejected;
    assert.equal(tab.store.get(), null);
  });
}

test("a login cancelled while waiting for the cookie lock leaves the current account intact", async () => {
  const available = deferred(),
    storage = new Map(),
    controller = new AbortController();
  let requests = 0;
  const tab = independentTab(
    storage,
    async () => {
      requests++;
      return json({});
    },
    {
      request: async (_, run) => {
        await available.promise;
        return run();
      },
    },
  );
  tab.store.changeSession();
  tab.store.set("current-account");
  const generation = tab.store.getSessionGeneration();
  const login = tab.api.login({}, { signal: controller.signal });
  const rejected = assert.rejects(login, { name: "AbortError" });
  controller.abort();
  available.resolve();
  await rejected;
  assert.equal(requests, 0);
  assert.equal(tab.store.getSessionGeneration(), generation);
  assert.equal(tab.store.get(), "current-account");
});
