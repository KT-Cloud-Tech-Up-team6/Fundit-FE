import assert from "node:assert/strict";
import test from "node:test";
import { STORY_BODY_REQUIRED, storyBodyError } from "./story-body.ts";

const doc = (...content) => ({ type: "doc", content });
const paragraph = (text) => ({
  type: "paragraph",
  ...(text === undefined ? {} : { content: [{ type: "text", text }] }),
});
const image = { type: "image", attrs: { src: "https://cdn.example/a.png" } };

test("글자·이미지·영상이 없는 본문은 막는다", () => {
  assert.equal(storyBodyError({ type: "doc" }), STORY_BODY_REQUIRED);
  assert.equal(storyBodyError(doc(paragraph())), STORY_BODY_REQUIRED);
  assert.equal(storyBodyError(doc(paragraph(), paragraph())), STORY_BODY_REQUIRED);
  assert.equal(
    storyBodyError(doc({ type: "paragraph", content: [{ type: "hardBreak" }] })),
    STORY_BODY_REQUIRED,
  );
  assert.equal(storyBodyError(doc({ type: "horizontalRule" })), STORY_BODY_REQUIRED);
});

test("공백과 보이지 않는 문자뿐인 본문은 막는다", () => {
  for (const text of [
    "   ",
    " \n\t",
    "\u00a0",
    "\u3000",
    "\u200b",
    "\u3164",
    "\u2800",
    "\u200b \u3164",
  ]) {
    assert.equal(storyBodyError(doc(paragraph(text))), STORY_BODY_REQUIRED, JSON.stringify(text));
  }
  assert.equal(storyBodyError(doc(paragraph("  "), paragraph("\u00a0"))), STORY_BODY_REQUIRED);
});

test("글자가 비어 있는 섹션·제목·목록은 막는다", () => {
  assert.equal(
    storyBodyError(doc({ type: "section", content: [paragraph()] })),
    STORY_BODY_REQUIRED,
  );
  assert.equal(storyBodyError(doc({ type: "heading", attrs: { level: 2 } })), STORY_BODY_REQUIRED);
  assert.equal(
    storyBodyError(
      doc({ type: "bulletList", content: [{ type: "listItem", content: [paragraph()] }] }),
    ),
    STORY_BODY_REQUIRED,
  );
});

test("글자가 하나라도 있으면 통과한다", () => {
  assert.equal(storyBodyError(doc(paragraph("가"))), "");
  assert.equal(storyBodyError(doc(paragraph("  가  "))), "");
  assert.equal(storyBodyError(doc(paragraph(), paragraph("본문"))), "");
  assert.equal(storyBodyError(doc(paragraph("👨‍👩‍👧"))), "");
});

test("섹션·제목·목록 안의 글자도 본문으로 본다", () => {
  assert.equal(storyBodyError(doc({ type: "section", content: [paragraph("예산")] })), "");
  assert.equal(
    storyBodyError(
      doc({ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "제목" }] }),
    ),
    "",
  );
  assert.equal(
    storyBodyError(
      doc({ type: "orderedList", content: [{ type: "listItem", content: [paragraph("하나")] }] }),
    ),
    "",
  );
});

test("이미지·영상만 있어도 통과한다", () => {
  assert.equal(storyBodyError(doc(image)), "");
  assert.equal(storyBodyError(doc({ type: "paragraph", content: [image] })), "");
  assert.equal(
    storyBodyError(
      doc({ type: "storyImageGroup", attrs: { layout: "two" }, content: [image, image] }),
    ),
    "",
  );
  assert.equal(
    storyBodyError(doc({ type: "video", attrs: { src: "https://cdn.example/a.mp4" } })),
    "",
  );
  assert.equal(
    storyBodyError(doc({ type: "youtube", attrs: { src: "https://www.youtube.com/watch?v=x" } })),
    "",
  );
});
