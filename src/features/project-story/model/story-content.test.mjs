import assert from "node:assert/strict";
import test from "node:test";
import { toIntroContent, fromIntroContent, safeStoryHtml } from "./story-content.ts";
import {
  confirmFundingStorySession,
  createFundingStoryRun,
  createFundingStorySession,
  getFundingStoryRun,
  isFundingStorySessionSynchronized,
  streamFundingStoryChat,
} from "../../../entities/project/api/story-api.ts";
import { authTokenStore } from "../../../shared/api/auth-token-store.ts";

test("story formatting serializes to the backend HTML contract and round-trips", () => {
  const document = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        attrs: { textAlign: "center" },
        content: [
          { type: "text", text: "bold", marks: [{ type: "bold" }] },
          { type: "text", text: " italic", marks: [{ type: "italic" }] },
          { type: "text", text: " underline", marks: [{ type: "underline" }] },
          {
            type: "text",
            text: " color",
            marks: [{ type: "textStyle", attrs: { color: "#123abc" } }],
          },
        ],
      },
      { type: "paragraph", content: [{ type: "hardBreak" }] },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "item" }] }],
          },
        ],
      },
    ],
  };
  const [{ value }] = toIntroContent(document);
  assert.equal(
    value,
    '<p style="text-align: center"><strong>bold</strong><em> italic</em><u> underline</u><span style="color: #123abc"> color</span></p><p><br></p><ul><li><p>item</p></li></ul>',
  );
  assert.deepEqual(toIntroContent(fromIntroContent([{ type: "TEXT", value }])), [
    { type: "TEXT", value },
  ]);
});

test("legacy plain text and HTML entities retain newlines and decoded text", () => {
  const legacy = fromIntroContent([{ type: "TEXT", value: "first\n\nthird & <fourth>" }]);
  assert.deepEqual(legacy.content[0].content, [
    { type: "text", text: "first" },
    { type: "hardBreak" },
    { type: "hardBreak" },
    { type: "text", text: "third & <fourth>" },
  ]);
  const html = fromIntroContent([{ type: "TEXT", value: "<p>Fish &amp; chips &lt;3</p>" }]);
  assert.equal(html.content[0].content[0].text, "Fish & chips <3");
});

test("pretty-printed server HTML does not create whitespace paragraphs", () => {
  const restored = fromIntroContent([{ type: "TEXT", value: "<p>first</p>\n<p>second</p>" }]);
  assert.deepEqual(restored.content, [
    { type: "paragraph", content: [{ type: "text", text: "first" }] },
    { type: "paragraph", content: [{ type: "text", text: "second" }] },
  ]);
  const nested = safeStoryHtml("<div><p>first</p><p>second</p></div>");
  assert.equal(nested[0].tag, "div");
});

test("public rich text drops malicious markup and non-contract styles", () => {
  const nodes = safeStoryHtml(
    '<p onclick="globalThis.pwned=1" style="color:#abc; background:url(javascript:alert(1)); text-align:center">safe<script>globalThis.pwned=1</script><img src=x onerror="globalThis.pwned=1"><span style="font-weight:700;position:fixed">styled</span></p>',
  );
  assert.deepEqual(nodes, [
    {
      tag: "p",
      style: { color: "#abc", textAlign: "center" },
      children: ["safe", { tag: "span", style: { fontWeight: "700" }, children: ["styled"] }],
    },
  ]);
});

test("self-closing script·style 뒤의 본문이 사라지지 않는다", () => {
  assert.deepEqual(safeStoryHtml("<p>before</p><script/><p>after</p>"), [
    { tag: "p", children: ["before"] },
    { tag: "p", children: ["after"] },
  ]);
  assert.deepEqual(safeStoryHtml("<p>before</p><style />after"), [
    { tag: "p", children: ["before"] },
    "after",
  ]);
  /* 여는 태그와 짝이 맞는 형태는 그대로 본문에서 제외한다. */
  assert.deepEqual(safeStoryHtml("<p>before</p><script>evil()</script><p>after</p>"), [
    { tag: "p", children: ["before"] },
    { tag: "p", children: ["after"] },
  ]);
});

test("bold로 대체할 수 없는 굵기는 편집 왕복에서 유지된다", () => {
  const value = '<p><span style="font-weight: 500">중요 안내</span></p>';
  const document = fromIntroContent([{ type: "TEXT", value }]);
  assert.deepEqual(document.content[0].content[0].marks, [
    { type: "textStyle", attrs: { fontWeight: "500" } },
  ]);
  assert.deepEqual(toIntroContent(document), [{ type: "TEXT", value }]);
  const both = '<p><span style="color: #123abc; font-weight: 300">색과 굵기</span></p>';
  assert.deepEqual(toIntroContent(fromIntroContent([{ type: "TEXT", value: both }])), [
    { type: "TEXT", value: both },
  ]);
  /* 굵기 700은 bold 마크로 표현되므로 <strong>으로 정규화한다. */
  assert.deepEqual(
    toIntroContent(
      fromIntroContent([
        { type: "TEXT", value: '<p><span style="font-weight: 700">굵게</span></p>' },
      ]),
    ),
    [{ type: "TEXT", value: "<p><strong>굵게</strong></p>" }],
  );
});

test("문자열 중간의 태그 모양은 과거 평문으로 취급한다", () => {
  const legacy = "설명 <b>예시</b> 참고해주세요";
  assert.deepEqual(safeStoryHtml(legacy), [legacy]);
  assert.deepEqual(toIntroContent(fromIntroContent([{ type: "TEXT", value: legacy }])), [
    { type: "TEXT", value: "<p>설명 &lt;b&gt;예시&lt;/b&gt; 참고해주세요</p>" },
  ]);
  assert.equal(safeStoryHtml("<p>서식</p>")[0].tag, "p");
});

test("텍스트·줄바꿈·이미지·영상은 저장과 복원 왕복에 유지된다", () => {
  const blocks = [
    { type: "TEXT", value: "첫 문단\n다음 줄" },
    { type: "IMAGE", value: "https://cdn/image.png" },
    { type: "VIDEO_URL", value: "https://cdn/video.mp4" },
    { type: "TEXT", value: "<script>태그도 텍스트</script>" },
  ];
  assert.deepEqual(toIntroContent(fromIntroContent(blocks)), [
    { type: "TEXT", value: "<p>첫 문단<br>다음 줄</p>" },
    blocks[1],
    blocks[2],
    { type: "TEXT", value: "<p>&lt;script&gt;태그도 텍스트&lt;/script&gt;</p>" },
  ]);
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
test("CRLF 프레임 경계가 스트림 청크 사이에서 나뉘어도 done 이벤트를 읽는다", async (t) => {
  authTokenStore.set("test");
  const encoder = new TextEncoder();
  t.mock.method(
    globalThis,
    "fetch",
    async () =>
      new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(
              encoder.encode('event: message\r\ndata: {"chat_id":"chat","text":"답변"}\r\n\r'),
            );
            controller.enqueue(
              encoder.encode(
                '\nevent: done\r\ndata: {"chat_id":"chat","status":"succeeded","session_id":"session","revision":2,"error":null}\r\n\r',
              ),
            );
            controller.enqueue(encoder.encode("\n"));
            controller.close();
          },
        }),
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
test("채팅 완료 revision과 active chat이 세션에 반영된 뒤에만 동기화 완료로 판단한다", () => {
  const session = {
    session_id: "session",
    revision: 2,
    confirmed_revision: null,
    messages: [],
    missing: [],
    summary: null,
    active_chat_id: null,
  };
  assert.equal(isFundingStorySessionSynchronized(session, 2), true);
  assert.equal(isFundingStorySessionSynchronized({ ...session, revision: 1 }, 2), false);
  assert.equal(isFundingStorySessionSynchronized({ ...session, active_chat_id: "chat" }, 2), false);
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
    if (node.type !== "paragraph")
      assert.throws(() => toIntroContent({ type: "doc", content: [node] }));
  assert.doesNotThrow(() =>
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

test("nested blocks and adjacent inline spacing survive server HTML restoration", () => {
  const value = '<div style="text-align:center;color:#abc"><p>first</p>\n<p>second</p></div>';
  const restored = fromIntroContent([{ type: "TEXT", value }]);
  assert.equal(restored.content.length, 2);
  assert.equal(restored.content[0].attrs.textAlign, "center");
  assert.equal(restored.content[1].content[0].text, "second");
  assert.deepEqual(restored.content[0].content[0].marks, [
    { type: "textStyle", attrs: { color: "#abc" } },
  ]);
  const inline = fromIntroContent([{ type: "TEXT", value: "<strong>a</strong> <em>b</em>" }]);
  assert.equal(inline.content.length, 1);
  assert.equal(inline.content[0].content.map((node) => node.text).join(""), "a b");
});

test("numeric entities cannot crash parsing and unsupported color is not silently lost", () => {
  assert.doesNotThrow(() => safeStoryHtml("<p>&#1114112;&#xD800;&#X1F600;</p>"));
  assert.equal(
    fromIntroContent([{ type: "TEXT", value: "<p>&#X1F600;</p>" }]).content[0].content[0].text,
    "😀",
  );
  assert.throws(() =>
    toIntroContent({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "color",
              marks: [{ type: "textStyle", attrs: { color: "invalid" } }],
            },
          ],
        },
      ],
    }),
  );
});
