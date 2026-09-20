import test from "node:test";
import assert from "node:assert/strict";
import { QueryClient } from "@tanstack/react-query";
import { fundingProjectQuery } from "./funding-project-query.ts";

test("order relationship cache avoids repeat scans but isolates members and invalidation", async (t) => {
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  let calls = 0;
  t.mock.method(globalThis, "fetch", async (url) => {
    calls++;
    return Response.json(
      url.includes("page=0")
        ? { content: [], hasNext: true }
        : {
            content: [{ orderId: "order", projectId: "project", projectTitle: "title" }],
            hasNext: false,
          },
    );
  });
  try {
    const options = fundingProjectQuery("member-a", "order");
    assert.equal((await cache.fetchQuery(options)).projectId, "project");
    await cache.fetchQuery(options);
    assert.equal(calls, 2);
    await cache.fetchQuery(fundingProjectQuery("member-b", "order"));
    assert.equal(calls, 4);
    await cache.invalidateQueries({ queryKey: options.queryKey });
    await cache.fetchQuery(options);
    assert.equal(calls, 6);
    cache.clear();
    await cache.fetchQuery(options);
    assert.equal(calls, 8);
  } finally {
    cache.clear();
  }
});

test("failed relationship lookup is retried without caching an invented mapping", async (t) => {
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    calls++;
    return Response.json(
      calls === 1
        ? { content: [], hasNext: false }
        : { content: [{ orderId: "order", projectId: "project" }], hasNext: false },
    );
  });
  try {
    const options = fundingProjectQuery("member", "order");
    await assert.rejects(cache.fetchQuery(options), /찾을 수 없습니다/);
    assert.equal((await cache.fetchQuery(options)).projectId, "project");
    assert.equal(calls, 2);
  } finally {
    cache.clear();
  }
});
