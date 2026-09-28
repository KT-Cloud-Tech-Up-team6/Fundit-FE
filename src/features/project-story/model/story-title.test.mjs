import assert from "node:assert/strict";
import test from "node:test";
import { STORY_TITLE_MAX_LENGTH, storyTitleError } from "./story-title.ts";

test("스토리 제목은 빈 값과 공백만인 값을 저장하지 않는다", () => {
  assert.equal(storyTitleError(""), "스토리 제목을 입력해주세요.");
  assert.equal(storyTitleError("  \n\t "), "스토리 제목을 입력해주세요.");
});

test("스토리 제목은 40자까지 허용하고 초과하면 막는다", () => {
  assert.equal(storyTitleError("가".repeat(STORY_TITLE_MAX_LENGTH)), "");
  assert.equal(
    storyTitleError("가".repeat(STORY_TITLE_MAX_LENGTH + 1)),
    "제목은 40자 이내로 입력해주세요.",
  );
});
