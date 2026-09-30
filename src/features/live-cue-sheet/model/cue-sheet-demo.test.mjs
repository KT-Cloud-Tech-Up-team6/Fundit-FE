import assert from "node:assert/strict";
import test from "node:test";
import { createDemoScenes, demoProject, isSkipIntent } from "./cue-sheet-demo.ts";

const project = {
  title: "친환경 데일리 백",
  category: "가방",
  period: "2026.09.01 - 2026.10.01",
  description: "가방만의 소개 문구",
  participantCount: 10,
  currentAmount: 100000,
  goalAmount: 200000,
};

test("선택한 프로젝트와 소개를 사용하고 다른 상품 정보를 섞지 않는다", () => {
  const scenes = createDemoScenes(
    5,
    ["직접 입력한 제품 설명", "개발 배경과 제작 과정", "예상 어려움", "가방 시연", "발송 안내"],
    project,
  );
  assert.match(scenes[0].script, /친환경 데일리 백/);
  assert.equal(scenes[1].script, "직접 입력한 제품 설명");
  assert.equal(scenes[2].script, "개발 배경과 제작 과정");
  assert.match(scenes[3].script, /가방 시연/);
  assert.doesNotMatch(JSON.stringify(scenes), /로보락|699,000|물걸레/);
  assert.equal(
    scenes.reduce((sum, scene) => sum + scene.duration, 0),
    300,
  );
});

test("미입력 답변과 리워드는 임의의 상품 사실로 채우지 않는다", () => {
  const scenes = createDemoScenes(10, [], project);
  assert.equal(scenes[1].script, project.description);
  assert.match(scenes[2].script, /입력하지 않은/);
  assert.match(scenes[4].script, /리워드 정보는 입력하지 않았습니다/);
  assert.doesNotMatch(JSON.stringify(scenes), /로보락|699,000|2주/);
});

test("전용 URL의 기본 데모와 명시적인 리워드도 지원한다", () => {
  assert.ok(createDemoScenes(10, [])[0].script.includes(demoProject.title));
  const scenes = createDemoScenes(1, [], { ...project, reward: "데일리 백 단품" });
  assert.match(scenes[4].script, /데일리 백 단품/);
  assert.equal(
    scenes.reduce((sum, scene) => sum + scene.duration, 0),
    60,
  );
});

test("건너뛰기 의도 문장을 전부 인식한다", () => {
  for (const text of [
    "스킵",
    "스킵할게요",
    "스킵해주세요",
    "건너뛰기",
    "건너뛸게요",
    "건너뛰어주세요",
    "패스",
    "패스요",
    "생략할게요",
    "모르겠어요",
    "몰라요",
    "없어요",
    "skip",
    "SKIP",
    "  스킵할게요  ",
    "스킵할게요.",
    "스킵할게요!",
    "다음으로",
    "다음으로 넘어갈게요",
    "다음으로 넘어갈래요",
    "다음 질문으로",
    "다음 질문으로 넘어갈게요",
    "이건 답 안 할래요",
    "이 질문엔 답 안 할래요",
    "답 안 할래요",
    "답 안 할게요",
    "답하지 않을게요",
    "생략하고 싶어요",
    "생략할래요",
    "노코멘트",
    "노 코멘트",
    "no comment",
    "No Comment",
  ]) {
    assert.ok(isSkipIntent(text), `"${text}"는 건너뛰기 의도로 인식돼야 함`);
  }
});

test("건너뛰기와 무관한 실제 답변은 건너뛰기로 오판하지 않는다", () => {
  for (const text of [
    "물걸레 청소랑 진공청소가 한번에 되는 무선청소기예요.",
    "가격은 69만9천원이고 없어요라는 말은 안 썼어요",
    "패스트푸드점에서 파일럿 테스트를 진행했습니다",
    "이 제품은 스킵 기능이 있는 리모컨을 포함합니다",
    "다음으로 넘어가기 전에 한 가지 더 말씀드리면 무게가 가볍다는 점이에요",
    "이건 답 안 할래요라고 말할 정도로 민감한 질문은 아니었어요",
    "",
    "   ",
  ]) {
    assert.equal(isSkipIntent(text), false, `"${text}"는 건너뛰기 의도가 아니어야 함`);
  }
});
