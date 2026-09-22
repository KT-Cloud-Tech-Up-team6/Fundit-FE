import test from "node:test";
import assert from "node:assert/strict";
import { getSchema } from "@tiptap/core";
import { storyExtensions } from "./story-extensions.ts";

/* 저장 계약(toIntroContent)이 직렬화하지 못하는 노드를 편집기가 만들 수 있으면, 다 쓰고 나서
   저장 단계에서야 막힌다(#259). 스키마에 아예 없어야 마크다운 입력·붙여넣기로도 생기지 않는다. */
test("저장할 수 없는 블록은 편집기 스키마에 없다", () => {
  const nodes = getSchema(storyExtensions).nodes;
  // blockquote는 BE RichTextSanitizer 허용 태그에 없다.
  for (const name of ["blockquote", "heading", "codeBlock", "horizontalRule"])
    assert.equal(name in nodes, false, `${name}이(가) 스키마에 남아 있다`);
  // 저장 가능한 블록은 유지한다.
  for (const name of ["paragraph", "bulletList", "orderedList", "listItem", "image"])
    assert.equal(name in nodes, true, `${name}이(가) 스키마에서 사라졌다`);
});

test("저장할 수 없는 마크는 편집기 스키마에 없다", () => {
  const marks = getSchema(storyExtensions).marks;
  for (const name of ["code", "strike", "link"])
    assert.equal(name in marks, false, `${name}이(가) 스키마에 남아 있다`);
  for (const name of ["bold", "italic", "underline", "textStyle"])
    assert.equal(name in marks, true, `${name}이(가) 스키마에서 사라졌다`);
});
