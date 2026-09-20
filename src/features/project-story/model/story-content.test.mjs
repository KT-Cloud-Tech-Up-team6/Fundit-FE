import assert from "node:assert/strict";
import test from "node:test";
import { toIntroContent, fromIntroContent } from "./story-content.ts";
import {
  generateFundingStory,
  applyFundingStory,
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
test("AI 세션은 서버 ID로 조회하고 명시적인 OVERWRITE 요청으로 적용한다", async (t) => {
  authTokenStore.set("test");
  const requests = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    requests.push([url, init]);
    return Response.json({
      sessionId: "session-server-id",
      status: "COMPLETED",
      result: { sections: [] },
    });
  });
  await generateFundingStory("project-uuid", "상품 설명");
  await applyFundingStory("session-server-id");
  assert.equal(requests[1][0], "/api/v1/ai/funding-story/sessions/session-server-id");
  assert.deepEqual(JSON.parse(requests[0][1].body), { productDescription: "상품 설명" });
  assert.deepEqual(JSON.parse(requests[2][1].body), { mode: "OVERWRITE" });
});
