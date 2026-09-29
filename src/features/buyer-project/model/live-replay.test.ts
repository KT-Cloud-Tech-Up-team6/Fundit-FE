import assert from "node:assert/strict";
import test from "node:test";
import type { LiveSummaryResponse } from "@/entities/live/api/seller-live-api";
import type { ProjectClip } from "@/features/live-integration/api/live-api";
import { clipVideo, endedLiveVideo } from "./live-replay";

const live: LiveSummaryResponse = {
  liveId: "0199c3a0-0000-7000-8000-000000000001",
  introText: "  로봇청소기 라이브  ",
  status: "ENDED",
  projectId: "0198f2b1-2c3d-7a1e-9c4f-6a2b1e0d8f01",
  thumbnailUrl: "https://cdn.test/live.jpg",
  scheduledStartAt: "2026-09-10T11:00:00Z",
  likeCount: 0,
  createdAt: "2026-09-01T00:00:00Z",
  actualStartAt: "2026-09-14T15:30:00Z",
};

const clip: ProjectClip = {
  liveId: live.liveId,
  highlightId: "0199e2/1",
  sceneLabel: "DEMO",
  title: "실시간 시연",
  clipUrl: "https://cdn.test/clip.mp4",
  thumbnailUrl: null,
  createdAt: "2026-09-06T16:00:00Z",
};

test("종료된 라이브는 다시보기로 가고 날짜는 실제 방송 시작일(한국 시간)이다", () => {
  const video = endedLiveVideo(live);
  assert.equal(video.href, `/live/${live.liveId}?mode=replay`);
  assert.equal(video.title, "로봇청소기 라이브");
  // 09-14 15:30 UTC는 한국 시간 09-15 00:30이다.
  assert.equal(video.date, "09.15");
  assert.equal(video.image, "https://cdn.test/live.jpg");
});

test("시작 시각이 없거나 소개 문구가 비면 날짜를 비우고 비었다고 적는다", () => {
  const video = endedLiveVideo({ ...live, actualStartAt: undefined, introText: " " });
  assert.equal(video.date, null);
  assert.equal(video.title, "소개 문구 없음");
});

test("숏 클립은 쇼츠 화면으로 가고 배지는 시연 영상·하이라이트 둘이다", () => {
  const video = clipVideo(clip);
  assert.equal(video.href, `/live/${live.liveId}?mode=replay&view=clip&clip=0199e2%2F1`);
  assert.equal(video.badge, "시연 영상");
  assert.equal(video.date, "09.07");
  assert.equal(clipVideo({ ...clip, sceneLabel: "PRICE_BENEFIT" }).badge, "하이라이트");
});

test("숏 클립 썸네일이 없으면 첫 프레임용 영상을 넘기고, 제목이 없으면 숏 클립이라 적는다", () => {
  const video = clipVideo({ ...clip, title: undefined });
  assert.equal(video.image, null);
  assert.equal(video.video, "https://cdn.test/clip.mp4");
  assert.equal(video.title, "숏 클립");
});
