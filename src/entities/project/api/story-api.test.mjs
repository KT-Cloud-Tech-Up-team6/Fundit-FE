import assert from "node:assert/strict";
import test from "node:test";
import { authTokenStore } from "../../../shared/api/auth-token-store.ts";
import {
  createFundingStorySession,
  discardFundingStoryRun,
  FundingStoryChatFailedError,
  getFundingStorySession,
  getLatestFundingStorySession,
  isFundingStorySessionSynchronized,
  sendFundingStoryMessage,
  streamFundingStoryChat,
  waitForFundingStoryRun,
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

test("run 폴링 대기 중 취소하면 다음 조회를 보내지 않는다", async (t) => {
  authTokenStore.set("test-token");
  t.after(() => authTokenStore.clear());
  let requests = 0;
  t.mock.method(globalThis, "fetch", async (url, init) => {
    assert.equal(url, "/api/v1/ai/runs/run-id");
    assert.equal(new Headers(init.headers).get("X-Project-Id"), projectId);
    requests += 1;
    return Response.json({ run_id: "run-id", status: "running", result: null });
  });

  const controller = new AbortController();
  const pending = waitForFundingStoryRun(projectId, "run-id", controller.signal);
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(requests, 1);
  controller.abort();

  await assert.rejects(pending, { name: "AbortError" });
  assert.equal(requests, 1);
});

test("폐기된 run은 폴링을 즉시 끝낸다", async (t) => {
  authTokenStore.set("test-token");
  t.after(() => authTokenStore.clear());
  let requests = 0;
  t.mock.method(globalThis, "fetch", async (url) => {
    assert.equal(url, "/api/v1/ai/runs/run-id");
    requests += 1;
    return Response.json({ run_id: "run-id", status: "discarded", result: null });
  });

  const run = await waitForFundingStoryRun(projectId, "run-id");
  assert.equal(run.status, "discarded");
  assert.equal(requests, 1);
});

test("run 폐기는 식별자 하나와 프로젝트 헤더를 보내고 빈 204 응답을 처리한다", async (t) => {
  authTokenStore.set("test-token");
  t.after(() => authTokenStore.clear());
  const bodies = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    assert.equal(url, "/api/v1/ai/runs/discard");
    assert.equal(init.method, "POST");
    assert.equal(new Headers(init.headers).get("X-Project-Id"), projectId);
    bodies.push(JSON.parse(init.body));
    return new Response(null, { status: 204 });
  });

  assert.equal(await discardFundingStoryRun(projectId, { runId: "run-id" }), undefined);
  assert.equal(
    await discardFundingStoryRun(projectId, { idempotencyKey: "creation-request-key" }),
    undefined,
  );
  assert.deepEqual(bodies, [{ run_id: "run-id" }, { idempotency_key: "creation-request-key" }]);
});

test("메시지는 첨부가 있을 때만 attachments를 붙이고 받은 message_id를 그대로 보낸다", async (t) => {
  authTokenStore.set("test-token");
  t.after(() => authTokenStore.clear());
  const bodies = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    assert.equal(url, "/api/v1/ai/sessions/session-id/messages");
    assert.equal(new Headers(init.headers).get("X-Project-Id"), projectId);
    bodies.push(JSON.parse(init.body));
    return Response.json({ chat_id: "chat-id", status: "queued" }, { status: 202 });
  });

  await sendFundingStoryMessage(projectId, "session-id", {
    messageId: "message-1",
    revision: 2,
    text: "글만",
  });
  await sendFundingStoryMessage(projectId, "session-id", {
    messageId: "message-2",
    revision: 3,
    text: "",
    attachmentUrls: ["https://cdn.test/media/projects/p/a.png"],
  });
  assert.deepEqual(bodies, [
    { message_id: "message-1", revision: 2, text: "글만" },
    {
      message_id: "message-2",
      revision: 3,
      text: "",
      attachments: [{ file_url: "https://cdn.test/media/projects/p/a.png", reward_id: null }],
    },
  ]);
});

test("AI 답변 생성 실패(done.status=failed)는 스트림 끊김과 구분되는 오류로 알린다", async (t) => {
  authTokenStore.set("test-token");
  t.after(() => authTokenStore.clear());
  const failed = {
    chat_id: "chat-id",
    status: "failed",
    session_id: "session-id",
    revision: 3,
    error: {
      code: "CHAT_FAILED",
      message: "답변 생성에 실패했습니다.",
      retryable: true,
      detail: null,
    },
  };
  let body = `event: done
data: ${JSON.stringify(failed)}

`;
  t.mock.method(globalThis, "fetch", async (url) => {
    assert.equal(url, "/api/v1/ai/chats/chat-id/events");
    return new Response(body, { headers: { "Content-Type": "text/event-stream" } });
  });

  await assert.rejects(
    streamFundingStoryChat(projectId, "chat-id", () => {}),
    (error) => {
      assert.ok(error instanceof FundingStoryChatFailedError);
      assert.equal(error.message, "답변 생성에 실패했습니다.");
      assert.equal(error.done.revision, 3);
      return true;
    },
  );
  body = `event: message
data: ${JSON.stringify({ text: "중간" })}

`;
  await assert.rejects(
    streamFundingStoryChat(projectId, "chat-id", () => {}),
    (error) => {
      assert.ok(!(error instanceof FundingStoryChatFailedError));
      return true;
    },
  );
});
