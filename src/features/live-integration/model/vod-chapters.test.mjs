import assert from "node:assert/strict";
import test from "node:test";
import {
  chapterRange,
  clipBadge,
  formatClock,
  formatPlaybackTime,
  pickClip,
  sceneLabelName,
  toChapters,
} from "./vod-chapters.ts";

const marker = (startSec, title) => ({
  highlightId: `h${startSec}`,
  sceneLabel: "INTRO",
  title,
  startSec,
  endSec: null,
  clipUrl: null,
  caption: null,
  isPublic: true,
  generationStatus: "COMPLETED",
});

const markers = [marker(120, "두 번째"), marker(0, "첫 번째"), marker(300, "세 번째")];

test("재생바 시각은 Figma처럼 시·분·초를 두 자리로 적는다", () => {
  assert.equal(formatPlaybackTime(0), "00:00:00");
  assert.equal(formatPlaybackTime(125.9), "00:02:05");
  assert.equal(formatPlaybackTime(3725), "01:02:05");
  assert.equal(formatPlaybackTime(-3), "00:00:00");
});

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

test("구간 유형은 BE enum 대신 한글 7종으로 적고, 모르는 값은 기타로 적는다", () => {
  assert.deepEqual(
    ["INTRO", "PRICE_BENEFIT", "DEMO", "SPEC", "COMPARISON", "AUDIENCE_REACTION", "CLOSING"].map(
      sceneLabelName,
    ),
    ["도입", "가격·혜택", "시연", "스펙·기능", "비교", "질문 응답", "마무리"],
  );
  assert.equal(sceneLabelName("HIGHLIGHT_NEW"), "기타");
  assert.deepEqual(
    toChapters(markers, 600).map((chapter) => chapter.label),
    ["도입", "도입", "도입"],
  );
});

test("쇼츠 배지는 시연만 시연 영상, 나머지는 하이라이트다", () => {
  assert.equal(clipBadge("DEMO"), "시연 영상");
  assert.equal(clipBadge("AUDIENCE_REACTION"), "하이라이트");
  assert.equal(clipBadge("PRICE_BENEFIT"), "하이라이트");
});

test("주소의 쇼츠를 고르고, 없거나 영상이 없으면 첫 재생 가능한 쇼츠를 고른다", () => {
  const clip = (id, clipUrl) => ({ ...marker(0, id), highlightId: id, endSec: 90, clipUrl });
  const clips = [clip("a", null), clip("b", "https://ai/b.mp4"), clip("c", "https://ai/c.mp4")];
  assert.equal(pickClip(clips, "c").highlightId, "c");
  assert.equal(pickClip(clips, "없는-id").highlightId, "b");
  assert.equal(pickClip(clips, undefined).highlightId, "b");
  assert.equal(pickClip(clips, "a").highlightId, "b");
  assert.equal(pickClip([clip("a", null)], "a"), null);
  assert.equal(pickClip([], undefined), null);
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
