import assert from "node:assert/strict";
import test from "node:test";
import { authTokenStore } from "@/shared/api/auth-token-store";
import { getAllMyLives } from "./seller-live-api";

const draft = (liveId: string) => ({
  liveId,
  introText: null,
  status: "DRAFT",
  projectId: "p1",
  thumbnailUrl: null,
  scheduledStartAt: null,
  likeCount: 0,
  createdAt: "2026-09-28T00:00:00Z",
});
const page = (ids: string[], index: number, hasNext: boolean, totalPages = 2) =>
  new Response(
    JSON.stringify({
      content: ids.map(draft),
      page: index,
      size: 2,
      totalElements: 3,
      totalPages,
      hasNext,
    }),
    { status: 200 },
  );

test("받는 사이 밀려 두 번 온 항목은 한 번만 남기고, 마지막 페이지에서 멈춘다", async (t) => {
  authTokenStore.set("qa-token");
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    calls += 1;
    /* hasNext가 계속 true여도 totalPages(2)에서 멈춰야 한다. */
    return calls === 1 ? page(["new", "a"], 0, true) : page(["a", "b"], 1, true);
  });
  const result = await getAllMyLives({ statuses: ["DRAFT"] });
  assert.deepEqual(
    result.content.map((item) => item.liveId),
    ["new", "a", "b"],
  );
  assert.equal(calls, 2);
});

test("hasNext가 끝날 때까지 받아 한 목록으로 합친다", async (t) => {
  authTokenStore.set("qa-token");
  const requested: string[] = [];
  t.mock.method(globalThis, "fetch", async (url: string) => {
    const query = new URL(url, "http://x").searchParams;
    requested.push(`${query.get("page")}:${query.get("size")}:${query.get("status")}`);
    return query.get("page") === "0" ? page(["a", "b"], 0, true) : page(["c"], 1, false);
  });
  const result = await getAllMyLives({ statuses: ["DRAFT"], size: 2 });
  assert.deepEqual(
    result.content.map((item) => item.liveId),
    ["a", "b", "c"],
  );
  assert.deepEqual(requested, ["0:2:DRAFT", "1:2:DRAFT"]);
});

test("hasNext가 잘못 와도 빈 페이지에서 멈춘다", async (t) => {
  authTokenStore.set("qa-token");
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    calls += 1;
    return calls === 1 ? page(["a"], 0, true) : page([], 1, true);
  });
  const result = await getAllMyLives({ statuses: ["DRAFT"] });
  assert.deepEqual(
    result.content.map((item) => item.liveId),
    ["a"],
  );
  assert.equal(calls, 2);
});
