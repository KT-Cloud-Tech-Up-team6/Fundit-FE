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
const run = {
  run_id: "run",
  status: "partially_succeeded",
  result: {
    cover_image_url: "https://cdn/cover.png",
    intro_content: [
      { type: "IMAGE", value: "https://cdn/body.png" },
      { type: "TEXT", value: "새 스토리" },
    ],
  },
  failed_slots: [{ slot_id: "benefit", stage: "generation", error: {} }],
  error: null,
};
test("AI 적용 성공 후 재진입에 사용하는 캐시를 갱신하고 다른 사용자는 보존", async () => {
  const cache = new QueryClient();
  cache.setQueryData(key, old);
  const other = ["seller-project-preview", "other", "project"];
  cache.setQueryData(other, old);
  await applyStory(cache, "owner", "project", run);
  assert.deepEqual(cache.getQueryData(key).introContent, run.result.intro_content);
  assert.equal(cache.getQueryData(key).coverImageUrl, "https://cdn/cover.png");
  assert.deepEqual(cache.getQueryData(other), old);
  cache.clear();
});
test("전체 실패 결과는 기존 스토리를 유지", async () => {
  const cache = new QueryClient();
  cache.setQueryData(key, old);
  await assert.rejects(
    applyStory(cache, "owner", "project", { ...run, status: "failed", result: null }),
  );
  assert.deepEqual(cache.getQueryData(key), old);
  cache.clear();
});
test("진행 중인 이전 조회가 적용 후 캐시를 덮어쓰지 않도록 취소", async () => {
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
  await applyStory(cache, "owner", "project", run);
  release(old);
  await request;
  assert.deepEqual(cache.getQueryData(key).introContent, run.result.intro_content);
  cache.clear();
});
