import assert from "node:assert/strict";
import test from "node:test";
import {
  getCommunityPosts,
  answerCommunityPost,
  createNotice,
  createNoticeComment,
  getNotices,
} from "./project-management-api.ts";
import { authTokenStore } from "../../../shared/api/auth-token-store.ts";

test("판매자 문의 조건과 페이지를 전달하고 서버 게시글 ID에 답변한다", async (t) => {
  authTokenStore.set("test");
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    calls.push([url, init]);
    return Response.json({ content: [], page: 1, hasNext: false });
  });
  await getCommunityPosts("project-uuid", 1, "QUESTION", true);
  await answerCommunityPost(731, "답변 내용");
  const url = new URL(calls[0][0], "https://example.com");
  assert.equal(url.searchParams.get("page"), "1");
  assert.equal(url.searchParams.get("answeredOnly"), "true");
  assert.equal(url.searchParams.get("postType"), "QUESTION");
  assert.equal(new Headers(calls[0][1].headers).get("Authorization"), "Bearer test");
  assert.equal(calls[1][0], "/api/v1/community/posts/731/answer");
  assert.deepEqual(JSON.parse(calls[1][1].body), { content: "답변 내용" });
});
test("새 소식과 댓글은 다른 서버 경로로 등록하고 권한 실패를 전파한다", async (t) => {
  authTokenStore.set("test");
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    calls.push([url, init]);
    return Response.json({ noticeId: 41 });
  });
  await createNotice("project-uuid", { noticeType: "EVENT", title: "제목", content: "본문" });
  await createNoticeComment(41, "댓글");
  await getNotices("project-uuid", 2);
  assert.equal(calls[0][0], "/api/v1/projects/project-uuid/notices");
  assert.equal(calls[1][0], "/api/v1/notices/41/comments");
  assert.match(calls[2][0], /page=2.*sort=LATEST/);
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({ code: "FORBIDDEN" }, { status: 403 }),
  );
  await assert.rejects(answerCommunityPost(731, "답변"), { status: 403 });
});
