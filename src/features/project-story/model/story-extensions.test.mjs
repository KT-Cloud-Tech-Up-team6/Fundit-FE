import test from "node:test";
import assert from "node:assert/strict";
import { getSchema } from "@tiptap/core";
import { storyExtensions } from "./story-extensions.ts";
import { fromIntroContent } from "./story-content.ts";

/* 저장 계약(toIntroContent)이 직렬화하지 못하는 노드를 편집기가 만들 수 있으면, 다 쓰고 나서
   저장 단계에서야 막힌다(#259). 스키마에 아예 없어야 마크다운 입력·붙여넣기로도 생기지 않는다. */
test("저장할 수 없는 블록은 편집기 스키마에 없다", () => {
  const nodes = getSchema(storyExtensions).nodes;
  // blockquote는 BE RichTextSanitizer 허용 태그에 없다.
  for (const name of ["blockquote", "codeBlock"])
    assert.equal(name in nodes, false, `${name}이(가) 스키마에 남아 있다`);
  // 저장 가능한 블록은 유지한다. 섹션·제목·구분선은 AI 하단을 편집 왕복하려고 있다(#331).
  for (const name of [
    "paragraph",
    "bulletList",
    "orderedList",
    "listItem",
    "image",
    "section",
    "heading",
    "horizontalRule",
  ])
    assert.equal(name in nodes, true, `${name}이(가) 스키마에서 사라졌다`);
});

test("저장할 수 없는 마크는 편집기 스키마에 없다", () => {
  const marks = getSchema(storyExtensions).marks;
  for (const name of ["code", "strike", "link"])
    assert.equal(name in marks, false, `${name}이(가) 스키마에 남아 있다`);
  for (const name of ["bold", "italic", "underline", "textStyle"])
    assert.equal(name in marks, true, `${name}이(가) 스키마에서 사라졌다`);
});

test("AI 하단을 불러온 문서는 편집기 스키마에 맞는다", () => {
  const style = "border-left: 3px solid #202124; font-size: 18px";
  const document = fromIntroContent([
    {
      type: "TEXT",
      value:
        `<section><h2 style="${style}">예산</h2><h3>소제목</h3><p>본문</p></section>` +
        '<hr style="border: 0; border-top: 1px solid #e6e6e6"><p>끝</p>',
    },
  ]);
  const node = getSchema(storyExtensions).nodeFromJSON(document);
  node.check();
  assert.equal(node.child(0).child(0).attrs.style, style);
  assert.equal(node.child(0).child(1).attrs.level, 3);
});

/* 붙여넣은 HTML의 level 값이 태그 이름으로 쓰이면 "…xhtml script" 같은 값으로 script 요소가 만들어졌다(#464 리뷰). */
test("제목 단계는 태그로만 정하고 그릴 때도 h2·h3만 쓴다", () => {
  const heading = getSchema(storyExtensions).nodes.heading;
  const pasted = (tagName) => ({
    tagName,
    getAttribute: (name) => (name === "level" ? "ttp://www.w3.org/1999/xhtml script" : null),
  });
  const [h2Rule, h3Rule] = heading.spec.parseDOM;
  assert.equal(h2Rule.getAttrs(pasted("H2")).level, 2);
  assert.equal(h3Rule.getAttrs(pasted("H3")).level, 3);
  assert.equal(
    heading.spec.toDOM(heading.create({ level: "http://www.w3.org/1999/xhtml script" }))[0],
    "h2",
  );
  assert.equal(heading.spec.toDOM(heading.create({ level: 3 }))[0], "h3");
});
