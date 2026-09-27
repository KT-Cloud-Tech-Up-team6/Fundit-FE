import assert from "node:assert/strict";
import test from "node:test";
import { ApiError } from "@/shared/api/api-error";
import {
  applySaved,
  changedClips,
  clipPage,
  formatClipDate,
  formatClipDuration,
  isShownPublic,
  pendingAfterFailure,
  splitSaveResults,
  toLiveClips,
} from "./live-clips.ts";

const live = (liveId, overrides = {}) => ({
  liveId,
  introText: null,
  status: "ENDED",
  projectId: "project",
  thumbnailUrl: `https://cdn.test/${liveId}.jpg`,
  scheduledStartAt: "2026-09-14T15:30:00Z",
  likeCount: 0,
  createdAt: "2026-09-01T00:00:00Z",
  ...overrides,
});

const highlight = (highlightId, startSec, overrides = {}) => ({
  highlightId,
  sceneLabel: "PRICE_BENEFIT",
  title: `클립 ${highlightId}`,
  startSec,
  endSec: startSec + 32,
  clipUrl: `https://ai.test/${highlightId}.mp4`,
  caption: null,
  isPublic: false,
  generationStatus: "COMPLETED",
  ...overrides,
});

test("생성일은 한국 시간 MM.DD, 읽을 수 없으면 비운다", () => {
  // UTC 15:30은 한국 시간으로 다음 날 00:30이다.
  assert.equal(formatClipDate("2026-09-14T15:30:00Z"), "09.15");
  assert.equal(formatClipDate("2026-01-05T00:00:00Z"), "01.05");
  assert.equal(formatClipDate("not-a-date"), null);
});

test("길이는 끝−시작을 MM:SS로 적고 끝 시각을 모르면 비운다", () => {
  assert.equal(formatClipDuration(10, 42), "00:32");
  assert.equal(formatClipDuration(0, 75.6), "01:16");
  assert.equal(formatClipDuration(10, null), null);
  assert.equal(formatClipDuration(50, 40), "00:00");
});

test("최신 LIVE 먼저, LIVE 안에서는 시작 시각 순서로 생성 완료 클립만 모은다", () => {
  const clips = toLiveClips([
    {
      live: live("new"),
      clips: [
        highlight("n2", 300, { sceneLabel: "DEMO" }),
        highlight("n-failed", 10, { generationStatus: "FAILED" }),
        highlight("n1", 20, { isPublic: true }),
        highlight("n-generating", 40, { generationStatus: "GENERATING" }),
      ],
    },
    {
      live: live("old", { scheduledStartAt: null, thumbnailUrl: null }),
      clips: [highlight("o1", 5, { endSec: null, clipUrl: null })],
    },
  ]);

  assert.deepEqual(
    clips.map((clip) => clip.highlightId),
    ["n1", "n2", "o1"],
  );
  assert.deepEqual(clips[0], {
    liveId: "new",
    highlightId: "n1",
    title: "클립 n1",
    badge: "하이라이트",
    dateLabel: "09.15",
    durationLabel: "00:32",
    clipUrl: "https://ai.test/n1.mp4",
    liveThumbnailUrl: "https://cdn.test/new.jpg",
    isPublic: true,
  });
  assert.equal(clips[1].badge, "시연 영상");
  // 방송 예정일이 없으면 LIVE 생성일을 쓴다.
  assert.equal(clips[2].dateLabel, "09.01");
  assert.equal(clips[2].durationLabel, null);
  assert.equal(clips[2].liveThumbnailUrl, null);
});

test("BE가 null 필드를 빼고 보내도(키 없음) 제목·길이·영상·썸네일을 채운다", () => {
  const omitted = highlight("m", 7);
  delete omitted.title;
  delete omitted.endSec;
  delete omitted.clipUrl;
  const source = live("l");
  delete source.scheduledStartAt;
  delete source.thumbnailUrl;
  const [clip] = toLiveClips([{ live: source, clips: [omitted] }]);
  assert.equal(clip.title, "제목 없음");
  assert.equal(clip.durationLabel, null);
  assert.equal(clip.clipUrl, null);
  assert.equal(clip.liveThumbnailUrl, null);
  assert.equal(clip.dateLabel, "09.01");
});

test("저장 대상은 서버 값과 달라진 클립뿐이다", () => {
  const [a, b, c] = toLiveClips([
    {
      live: live("l"),
      clips: [highlight("a", 1), highlight("b", 2, { isPublic: true }), highlight("c", 3)],
    },
  ]);
  const pending = { a: true, b: true, c: false, gone: true };
  assert.equal(isShownPublic(a, pending), true);
  assert.equal(isShownPublic(b, {}), true);
  assert.deepEqual(
    changedClips([a, b, c], pending).map((clip) => clip.highlightId),
    ["a"],
  );
  assert.deepEqual(changedClips([a, b, c], {}), []);
});

test("일부 실패하면 실패한 클립만 BE 문구와 함께 남기고 성공분은 공개 여부를 뒤집는다", () => {
  const clips = toLiveClips([
    {
      live: live("l"),
      clips: [
        highlight("a", 1),
        highlight("b", 2, { isPublic: true }),
        highlight("c", 3),
        highlight("d", 4),
      ],
    },
  ]);
  const [a, b, c] = clips;
  const conflict = new ApiError({
    code: "CONFLICT",
    message: "생성에 실패한 항목은 공개할 수 없습니다.",
    status: 409,
  });
  const { saved, failed } = splitSaveResults(
    [a, b, c],
    [
      { status: "rejected", reason: conflict },
      { status: "fulfilled", value: undefined },
      { status: "rejected", reason: new TypeError("Failed to fetch") },
    ],
  );

  assert.deepEqual(
    saved.map((clip) => clip.highlightId),
    ["b"],
  );
  assert.deepEqual(
    failed.map(({ clip, reason }) => [clip.highlightId, reason]),
    [
      ["a", "생성에 실패한 항목은 공개할 수 없습니다."],
      ["c", "네트워크 연결을 확인한 뒤 다시 시도해 주세요."],
    ],
  );
  // 실패한 클립은 원하던 값(서버 값의 반대)으로 다시 저장 대기다.
  assert.deepEqual(pendingAfterFailure(failed), { a: true, c: true });
  assert.deepEqual(pendingAfterFailure([]), {});
  assert.deepEqual(
    applySaved(clips, saved).map((clip) => [clip.highlightId, clip.isPublic]),
    [
      ["a", false],
      ["b", false],
      ["c", false],
      ["d", false],
    ],
  );
});

test("페이지는 6개씩이고 범위를 벗어나면 마지막 페이지, 숫자가 아니면 첫 페이지다", () => {
  assert.deepEqual(clipPage(1, 0), { page: 1, totalPages: 1 });
  assert.deepEqual(clipPage(2, 9), { page: 2, totalPages: 2 });
  assert.deepEqual(clipPage(5, 9), { page: 2, totalPages: 2 });
  assert.deepEqual(clipPage(2, 6), { page: 1, totalPages: 1 });
  assert.deepEqual(clipPage(Number.NaN, 12), { page: 1, totalPages: 2 });
  assert.deepEqual(clipPage(1.5, 12), { page: 1, totalPages: 2 });
  assert.deepEqual(clipPage(0, 12), { page: 1, totalPages: 2 });
});
