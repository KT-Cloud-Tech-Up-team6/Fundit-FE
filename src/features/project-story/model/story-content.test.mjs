import assert from "node:assert/strict";
import test from "node:test";
import { toIntroContent, fromIntroContent } from "./story-content.ts";
import {
  confirmFundingStorySession,
  createFundingStoryRun,
  createFundingStorySession,
  getFundingStoryRun,
  streamFundingStoryChat,
} from "../../../entities/project/api/story-api.ts";
import { authTokenStore } from "../../../shared/api/auth-token-store.ts";

test("텍스트·줄바꿈·이미지·영상은 저장과 복원 왕복에 유지된다", () => {
  const blocks = [
    { type: "TEXT", value: "첫 문단\n다음 줄" },
    { type: "IMAGE", value: "https://cdn/image.png" },
    { type: "VIDEO_URL", value: "https://cdn/video.mp4" },
    { type: "TEXT", value: "<script>태그도 텍스트</script>" },
  ];
  assert.deepEqual(toIntroContent(fromIntroContent(blocks)), blocks);
  const video = fromIntroContent([
    { type: "VIDEO_URL", value: "https://www.youtube.com/watch?v=12345678901" },
  ]);
  assert.equal(video.content[0].type, "youtube");
});
test("채팅 SSE의 누적 message와 done 이벤트를 읽는다", async (t) => {
  authTokenStore.set("test");
  t.mock.method(
    globalThis,
    "fetch",
    async () =>
      new Response(
        [
          'event: message\ndata: {"chat_id":"chat","text":"답변"}\n\n',
          'event: done\ndata: {"chat_id":"chat","status":"succeeded","session_id":"session","revision":2,"error":null}\n\n',
        ].join(""),
        { headers: { "Content-Type": "text/event-stream" } },
      ),
  );
  let streamed = "";
  const done = await streamFundingStoryChat("project-uuid", "chat", (text) => {
    streamed = text;
  });
  assert.equal(streamed, "답변");
  assert.equal(done.revision, 2);
});
test("서식·이미지 배치·로컬 파일·중간 빈 문단은 손실시키지 않고 저장을 거부한다", () => {
  for (const node of [
    { type: "blockquote", content: [] },
    { type: "storyImageGroup", content: [] },
    {
      type: "paragraph",
      attrs: { textAlign: "center" },
      content: [{ type: "text", text: "내용" }],
    },
    { type: "paragraph", content: [{ type: "text", text: "내용", marks: [{ type: "bold" }] }] },
    { type: "image", attrs: { src: "data:image/png;base64,AA==" } },
  ])
    assert.throws(() => toIntroContent({ type: "doc", content: [node] }));
  assert.throws(() =>
    toIntroContent({
      type: "doc",
      content: [
        { type: "paragraph" },
        { type: "paragraph", content: [{ type: "text", text: "다음" }] },
      ],
    }),
  );
});
test("AI 계약은 동일한 api/v1/ai 경로와 X-Project-Id를 사용한다", async (t) => {
  authTokenStore.set("test");
  const requests = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    requests.push([url, init]);
    if (String(url).endsWith("/sessions"))
      return Response.json({ session_id: "session-server-id", revision: 1, messages: [] });
    if (String(url).endsWith("/confirm"))
      return Response.json({ session_id: "session-server-id", confirmed_revision: 1 });
    if (init.method === "POST") return Response.json({ run_id: "run-server-id", status: "queued" });
    return Response.json({ run_id: "run-server-id", status: "running" });
  });
  await createFundingStorySession("project-uuid");
  await confirmFundingStorySession("project-uuid", "session-server-id", 1);
  await createFundingStoryRun("project-uuid", "session-server-id", 1, "run-key");
  await getFundingStoryRun("project-uuid", "run-server-id");
  assert.deepEqual(
    requests.map(([url]) => url),
    [
      "/api/v1/ai/sessions",
      "/api/v1/ai/sessions/session-server-id/confirm",
      "/api/v1/ai/runs",
      "/api/v1/ai/runs/run-server-id",
    ],
  );
  for (const [, init] of requests)
    assert.equal(new Headers(init.headers).get("X-Project-Id"), "project-uuid");
  assert.deepEqual(JSON.parse(requests[0][1].body), {});
  assert.deepEqual(JSON.parse(requests[2][1].body), {
    session_id: "session-server-id",
    confirmed_revision: 1,
    idempotency_key: "run-key",
  });
});
