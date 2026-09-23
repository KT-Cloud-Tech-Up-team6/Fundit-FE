import assert from "node:assert/strict";
import test from "node:test";
import { searchProjects, getPublicProject } from "./buyer-project-api.ts";

test("공개 검색은 BE 정렬·종료 구분·페이지를 전달하고 목록의 숫자 ID를 UUID로 바꾸지 않는다", async (t) => {
  let request;
  t.mock.method(globalThis, "fetch", async (url, init) => {
    request = { url, init };
    return Response.json({ content: [{ projectId: 731 }], hasNext: false });
  });
  const result = await searchProjects("청소기 & 무선", "DEADLINE", true, 1);
  const url = new URL(request.url, "https://example.com");
  assert.equal(url.searchParams.get("keyword"), "청소기 & 무선");
  assert.equal(url.searchParams.get("subTab"), "ENDED");
  assert.equal(url.searchParams.get("sort"), "DEADLINE");
  assert.equal(url.searchParams.get("page"), "1");
  assert.equal(result.content[0].projectId, 731);
  assert.equal(new Headers(request.init.headers).has("Authorization"), false);
});
test("공개 상세 404를 오류로 전달한다", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({ code: "NOT_FOUND" }, { status: 404 }),
  );
  await assert.rejects(getPublicProject("unknown-uuid"), { status: 404 });
});
