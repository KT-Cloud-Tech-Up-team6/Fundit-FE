import assert from "node:assert/strict";
import test from "node:test";
import { chapterRange, formatClock, toChapters } from "./vod-chapters.ts";

const marker = (startSec, title) => ({
  highlightId: `h${startSec}`,
  sceneLabel: "도입",
  title,
  startSec,
  endSec: null,
  clipUrl: null,
  caption: null,
  isPublic: true,
  generationStatus: "COMPLETED",
});

const markers = [marker(120, "두 번째"), marker(0, "첫 번째"), marker(300, "세 번째")];

test("시각은 mm:ss로 적는다", () => {
  assert.equal(formatClock(0), "00:00");
  assert.equal(formatClock(75), "01:15");
  assert.equal(formatClock(3599.9), "59:59");
});

test("응답 순서와 무관하게 시작 시각 순서로 진행률을 매긴다", () => {
  assert.deepEqual(
    toChapters(markers, 600).map((chapter) => [chapter.time, chapter.progress]),
    [
      ["00:00", 0],
      ["02:00", 20],
      ["05:00", 50],
    ],
  );
});

test("영상 길이를 모르면 구간을 그리지 않는다", () => {
  assert.deepEqual(toChapters(markers, 0), []);
});

test("현재 위치가 속한 구간의 다음 구간 시작까지를 범위로 잡는다", () => {
  assert.deepEqual(chapterRange(markers, 0, 600), { fromSec: 0, toSec: 120 });
  assert.deepEqual(chapterRange(markers, 119, 600), { fromSec: 0, toSec: 120 });
  assert.deepEqual(chapterRange(markers, 120, 600), { fromSec: 120, toSec: 300 });
  assert.deepEqual(chapterRange(markers, 590, 600), { fromSec: 300, toSec: 600 });
});

test("첫 구간에 아직 닿지 않았으면 조회하지 않는다", () => {
  assert.equal(chapterRange([marker(30, "늦게 시작")], 10, 600), null);
  assert.deepEqual(chapterRange([marker(30, "늦게 시작")], 30, 600), { fromSec: 30, toSec: 600 });
});

test("구간이 없거나 길이를 모르면 조회하지 않는다", () => {
  assert.equal(chapterRange([], 10, 600), null);
  assert.equal(chapterRange(markers, 10, 0), null);
});

test("마지막 구간이 영상 끝과 같으면 빈 범위를 만들지 않는다", () => {
  assert.equal(chapterRange([marker(600, "끝")], 600, 600), null);
});
