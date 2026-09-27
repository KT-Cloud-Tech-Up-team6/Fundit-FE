import assert from "node:assert/strict";
import test from "node:test";
import { authTokenStore } from "../../../shared/api/auth-token-store.ts";
import {
  createFundingStorySession,
  getFundingStorySession,
  getLatestFundingStorySession,
  isFundingStorySessionSynchronized,
} from "./story-api.ts";

const projectId = "project-id";
const initialSession = {
  session_id: "session-id",
  revision: 1,
  messages: [],
  missing: ["product"],
};

test("null이 생략된 최신·초기 세션 응답을 수용한다", async (t) => {
  authTokenStore.set("test-token");
  t.after(() => authTokenStore.clear());
  let latestPayload = {};
  t.mock.method(globalThis, "fetch", async (url, init) => {
    assert.equal(new Headers(init.headers).get("X-Project-Id"), projectId);
    if (url === "/api/v1/ai/sessions/latest") return Response.json(latestPayload);
    if (url === "/api/v1/ai/sessions" && init.method === "POST") {
      return Response.json(initialSession, { status: 201 });
    }
    throw new Error(`예상하지 않은 요청: ${url}`);
  });

  const latest = await getLatestFundingStorySession(projectId);
  assert.equal(latest.session, undefined);
  latestPayload = { session: null };
  assert.equal((await getLatestFundingStorySession(projectId)).session, null);
  const created = latest.session ?? (await createFundingStorySession(projectId));
  assert.equal(created.active_chat_id, undefined);
  assert.equal(created.confirmed_revision, undefined);
  assert.equal(created.summary, undefined);
  assert.equal(isFundingStorySessionSynchronized(created, 1), true);
  assert.equal(isFundingStorySessionSynchronized(created, 2), false);
});

test("완료 세션의 생략·명시적 null을 동등하게 처리하고 진행 중 채팅은 구분한다", async (t) => {
  authTokenStore.set("test-token");
  t.after(() => authTokenStore.clear());
  t.mock.method(globalThis, "fetch", async (url, init) => {
    assert.equal(url, "/api/v1/ai/sessions/session-id");
    assert.equal(new Headers(init.headers).get("X-Project-Id"), projectId);
    return Response.json({
      ...initialSession,
      revision: 2,
      missing: [],
      summary: { product: "제품", story: "이야기", strengths: [] },
    });
  });

  const completed = await getFundingStorySession(projectId, initialSession.session_id);
  assert.equal(isFundingStorySessionSynchronized(completed, 2), true);
  assert.equal(isFundingStorySessionSynchronized({ ...completed, active_chat_id: null }, 2), true);
  assert.equal(
    isFundingStorySessionSynchronized({ ...completed, active_chat_id: "chat-id" }, 2),
    false,
  );
  assert.equal(isFundingStorySessionSynchronized(completed, 3), false);
});
