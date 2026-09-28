import assert from "node:assert/strict";
import test from "node:test";
import type { ProjectCardResponse } from "@/entities/project/api/buyer-project-api";
import type { LiveSummaryResponse } from "@/entities/live/api/seller-live-api";
import { featuredCard, liveCard } from "./home-cards";

const uuid = "0198f2b1-2c3d-7a1e-9c4f-6a2b1e0d8f01";

const row: ProjectCardResponse = {
  projectId: 123,
  projectPublicId: uuid,
  projectDisplayCode: "F0000123",
  title: "세상에 없는 프라이팬",
  thumbnailUrl: "https://cdn.example.com/p/123/thumb.jpg",
  categoryMajor: "테크·가전",
  categoryMinor: "생활가전",
  status: "ONGOING",
  achievementRate: 1520,
  sellerDisplayName: "프라이팬장인",
  remainingDays: 5,
};

test("featured cards open the detail by public UUID and show the major category", () => {
  const card = featuredCard(row);
  assert.equal(card.href, `/projects/${uuid}`);
  assert.equal(card.category, "테크·가전");
  assert.equal(card.seller, "프라이팬장인");
  assert.equal(card.achievement, "1,520% 달성");
});

test("featured cards without a public UUID never link to the numeric project id", () => {
  for (const projectPublicId of [undefined, null, "", "123", "../admin"]) {
    assert.equal(featuredCard({ ...row, projectPublicId }).href, undefined);
  }
});

const live: LiveSummaryResponse = {
  liveId: "0198f2b1-2c3d-7a1e-9c4f-6a2b1e0d8f99",
  introText: "  환절기 스킨케어 라이브  ",
  status: "LIVE",
  projectId: uuid,
  thumbnailUrl: null,
  scheduledStartAt: null,
  likeCount: 0,
  createdAt: "2026-09-27T01:00:00Z",
  viewerCount: 12345,
};

test("live cards open the room and format the viewer count", () => {
  const card = liveCard(live);
  assert.equal(card.href, `/live/${live.liveId}`);
  assert.equal(card.title, "환절기 스킨케어 라이브");
  assert.equal(card.viewers, "12,345");
});

test("live cards show the seller only when BE sends a nickname", () => {
  assert.equal(liveCard(live).seller, undefined);
  assert.equal(liveCard({ ...live, sellerNickname: null }).seller, undefined);
  assert.equal(liveCard({ ...live, sellerNickname: "  " }).seller, undefined);
  assert.equal(liveCard({ ...live, sellerNickname: "뷰티마켓" }).seller, "뷰티마켓");
});

test("live cards without a viewer count hide the badge value", () => {
  assert.equal(liveCard({ ...live, viewerCount: undefined }).viewers, undefined);
});
