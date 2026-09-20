import test from "node:test";
import assert from "node:assert/strict";
import { QueryClient } from "@tanstack/react-query";
import { applyStory } from "./apply-story.ts";
const key = ["seller-project-preview", "owner", "project"];
const old = {
  projectId: "project",
  title: "제목",
  introContent: [{ type: "TEXT", value: "이전 스토리" }],
};
const session = { sessionId: "session", result: { sections: [{ body: "새 스토리", images: [] }] } };
test("AI 적용 성공 후 재진입에 사용하는 캐시를 갱신하고 다른 사용자는 보존", async (t) => {
  const cache = new QueryClient();
  cache.setQueryData(key, old);
  const other = ["seller-project-preview", "other", "project"];
  cache.setQueryData(other, old);
  t.mock.method(globalThis, "fetch", async () => Response.json({ projectId: "project" }));
  await applyStory(cache, "owner", "project", session);
  assert.deepEqual(cache.getQueryData(key).introContent, [{ type: "TEXT", value: "새 스토리" }]);
  assert.deepEqual(cache.getQueryData(other), old);
  cache.clear();
});
test("AI 적용 실패 시 기존 스토리를 유지", async (t) => {
  const cache = new QueryClient();
  cache.setQueryData(key, old);
  t.mock.method(globalThis, "fetch", async () => new Response("", { status: 503 }));
  await assert.rejects(applyStory(cache, "owner", "project", session));
  assert.deepEqual(cache.getQueryData(key), old);
  cache.clear();
});
test("진행 중인 이전 조회가 적용 후 캐시를 덮어쓰지 않도록 취소", async (t) => {
  const cache = new QueryClient();
  cache.setQueryData(key, old);
  let release;
  const request = cache
    .fetchQuery({
      queryKey: key,
      queryFn: () =>
        new Promise((r) => {
          release = r;
        }),
    })
    .catch(() => {});
  t.mock.method(globalThis, "fetch", async () => Response.json({}));
  await applyStory(cache, "owner", "project", session);
  release(old);
  await request;
  assert.equal(cache.getQueryData(key).introContent[0].value, "새 스토리");
  cache.clear();
});
