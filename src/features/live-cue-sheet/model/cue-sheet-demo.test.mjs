import assert from "node:assert/strict";
import test from "node:test";
import { createDemoScenes, demoProject } from "./cue-sheet-demo.ts";

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
    ["개발 배경", "제작 과정", "예상 어려움", "가방 시연", "발송 안내"],
    project,
  );
  assert.match(scenes[0].script, /친환경 데일리 백/);
  assert.equal(scenes[1].script, project.description);
  assert.match(scenes[3].script, /가방 시연/);
  assert.doesNotMatch(JSON.stringify(scenes), /로보락|699,000|물걸레/);
  assert.equal(
    scenes.reduce((sum, scene) => sum + scene.duration, 0),
    300,
  );
});

test("미입력 답변과 리워드는 임의의 상품 사실로 채우지 않는다", () => {
  const scenes = createDemoScenes(10, [], project);
  assert.match(scenes[2].script, /입력하지 않은/);
  assert.match(scenes[4].script, /리워드 정보는 입력하지 않았습니다/);
  assert.doesNotMatch(JSON.stringify(scenes), /로보락|699,000|2주/);
});

test("전용 URL의 기본 데모와 명시적인 리워드도 지원한다", () => {
  assert.match(createDemoScenes(10, [])[0].script, new RegExp(demoProject.title));
  const scenes = createDemoScenes(1, [], { ...project, reward: "데일리 백 단품" });
  assert.match(scenes[4].script, /데일리 백 단품/);
  assert.equal(
    scenes.reduce((sum, scene) => sum + scene.duration, 0),
    60,
  );
});
