import assert from "node:assert/strict";
import test from "node:test";
import type { ProjectListItem } from "@/entities/project/api/seller-project-api";
import { fromProjectListItem, fromProjectPreview, projectsInCategory } from "./live-project";

const item = (overrides: Partial<ProjectListItem> = {}): ProjectListItem => ({
  projectId: "0199c3a0-1b2c-7a3b-8c4d-00000000aaaa",
  title: "로보락 F25",
  thumbnailUrl: "https://cdn.example/f25.png",
  status: "ONGOING",
  createdAt: "2026-09-01T00:00:00Z",
  fundingStartAt: "2026-09-01T00:00:00Z",
  fundingDeadline: "2026-10-12T14:59:59Z",
  goalAmount: 5_000_000,
  categoryMajor: "테크·가전",
  categoryMinor: "생활가전",
  currentAmount: 6_400_000,
  participantCount: 132,
  achievementRate: 128,
  ...overrides,
});

test("목록 응답은 기간·참여자·모금액까지 카드에 싣는다", () => {
  assert.deepEqual(fromProjectListItem(item()), {
    id: "0199c3a0-1b2c-7a3b-8c4d-00000000aaaa",
    title: "로보락 F25",
    category: "테크·가전",
    period: "2026.09.01 - 2026.10.12",
    participantCount: 132,
    currentAmount: 6_400_000,
    goalAmount: 5_000_000,
    image: "https://cdn.example/f25.png",
  });
});

test("빠진 제목·이미지·카테고리·날짜를 다른 값으로 채우지 않는다", () => {
  const card = fromProjectListItem(
    item({ title: null, thumbnailUrl: null, categoryMajor: null, fundingDeadline: null }),
  );
  assert.equal(card.title, "제목 없음");
  assert.equal(card.image, "");
  assert.equal(card.category, "");
  assert.equal(card.period, "2026.09.01 - 미정");
});

test("기간은 한국 시각 날짜로 적는다(UTC 15시 이후는 다음 날)", () => {
  assert.equal(
    fromProjectListItem(item({ fundingStartAt: "2026-08-31T15:00:00Z" })).period,
    "2026.09.01 - 2026.10.12",
  );
});

test("미리보기 응답에 없는 기간·참여자·모금액은 비운다", () => {
  const card = fromProjectPreview("p1", {
    projectId: "p1",
    title: "",
    status: "ONGOING",
    goalAmount: 1_000_000,
    coverImageUrl: null,
    categoryMajor: "뷰티",
  });
  assert.deepEqual(card, {
    id: "p1",
    title: "제목 없음",
    category: "뷰티",
    period: "",
    participantCount: null,
    currentAmount: null,
    goalAmount: 1_000_000,
    image: "",
  });
});

test("고른 카테고리의 프로젝트만 남긴다", () => {
  const items = [
    item({ projectId: "a" }),
    item({ projectId: "b", categoryMajor: "뷰티" }),
    item({ projectId: "c", categoryMajor: null }),
  ];
  assert.deepEqual(
    projectsInCategory(items, "테크·가전").map((project) => project.projectId),
    ["a"],
  );
  assert.deepEqual(projectsInCategory(items, "패션"), []);
});
