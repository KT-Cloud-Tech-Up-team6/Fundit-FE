import assert from "node:assert/strict";
import test from "node:test";
import {
  createStoryState,
  storyBody,
  storyFixture,
  storyQuestions,
  storyReducer,
  storySummary,
} from "./story-demo.ts";

test("빈 입력은 무시하고 질문 수는 배열에서 파생한다", () => {
  const initial = createStoryState();
  assert.equal(storyReducer(initial, { type: "send", text: "  " }), initial);
  let state = storyReducer(initial, { type: "send", text: "내 제품" });
  assert.equal(state.messages.at(-1).question, 1);
  for (let index = 0; index < storyQuestions.length; index++) {
    assert.equal(state.messages.at(-1).question, index + 1);
    state = storyReducer(state, { type: "send", text: "해당 사항 없음" });
  }
  assert.equal(state.stage, "summarizing");
  assert.equal(state.answers.length, 3);
});

test("요약 수정 요청과 건너뛰기가 결과에 반영된다", () => {
  let state = storyFixture("summary");
  state = storyReducer(state, { type: "send", text: "추천 대상을 1인 가구로 수정" });
  assert.equal(state.stage, "summarizing");
  state = storyReducer(state, { type: "summary-ready" });
  assert.match(storySummary(state), /추천 대상을 1인 가구로 수정/);
  assert.match(storyBody(state), /해당 사항 없음/);
});

test("생성 중 중복 입력과 잘못된 상태 전이는 무시한다", () => {
  const state = storyFixture("generating");
  for (const action of [
    { type: "send", text: "중복" },
    { type: "generate" },
    { type: "summary-ready" },
    { type: "result" },
  ])
    assert.equal(storyReducer(state, action), state);
  assert.equal(storyReducer(state, { type: "ready" }).stage, "ready");
});

test("재생성은 입력을 유지하며 다른 목업 제목을 제공한다", () => {
  const first = storyFixture("result");
  const next = storyReducer(first, { type: "generate" });
  assert.equal(next.description, first.description);
  assert.deepEqual(next.answers, first.answers);
  assert.notEqual(storyBody(next), storyBody(first));
  assert.equal(storyReducer(first, { type: "back" }).stage, "summary");
});
