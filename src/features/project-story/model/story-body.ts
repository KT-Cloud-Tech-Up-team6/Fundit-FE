import type { JSONContent } from "@tiptap/core";

export const STORY_BODY_REQUIRED = "스토리 본문을 입력해 주세요.";

/* 공백과 보이지 않는 문자를 뺀다. trim()은 한글 채움 문자(U+3164)·폭 없는 문자(U+200B)·점자 빈칸(U+2800)을
   지우지 못해 그것만 넣어도 본문이 있는 것으로 보인다. order-checkout의 INVISIBLE(QA-064)과 같은 규칙이며,
   feature끼리 의존하지 않도록 복사했다. */
const INVISIBLE = /[\s\p{Cc}\p{Cf}\p{Default_Ignorable_Code_Point}\u2800]/gu;
const mediaTypes = new Set(["image", "video", "youtube"]);

/* 섹션·목록·이미지 묶음 안까지 내려가며 보이는 글자나 이미지·영상이 하나라도 있는지 본다. */
function hasBody(node: JSONContent): boolean {
  if (mediaTypes.has(node.type ?? "")) return true;
  if (node.text?.replace(INVISIBLE, "")) return true;
  return node.content?.some(hasBody) ?? false;
}

/** 글자·이미지·영상이 없거나 보이지 않는 문자뿐인 본문이면 안내 문구를, 아니면 빈 문자열을 돌려준다. */
export function storyBodyError(document: JSONContent) {
  return hasBody(document) ? "" : STORY_BODY_REQUIRED;
}
