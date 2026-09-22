import assert from "node:assert/strict";
import test from "node:test";
import { projectCard } from "./project-card";
import type { ProjectCardResponse } from "../api/buyer-project-api";

const card: ProjectCardResponse = {
  projectId: 42,
  projectDisplayCode: "project-42",
  title: "프로젝트",
  thumbnailUrl: null,
  categoryMajor: "테크",
  categoryMinor: "가전",
  status: "FUNDING",
  achievementRate: 25,
  sellerDisplayName: "판매자",
  remainingDays: 3,
};

test("internal identity stays stable while detail uses the public UUID", () => {
  const uuid = "11111111-2222-4333-8444-555555555555";
  const result = projectCard({ ...card, projectPublicId: uuid });
  assert.equal(result.id, "42");
  assert.equal(result.detailId, uuid);
});

test("missing, malformed, numeric and path-like public IDs never enable detail", () => {
  for (const publicId of [
    undefined,
    null,
    "",
    "42",
    "search-project-1",
    "../admin",
    "11111111-2222-4333-8444-555555555555?tab=story",
    42,
  ]) {
    const result = projectCard({ ...card, projectPublicId: publicId as string | null | undefined });
    assert.equal(result.detailId, null);
  }
});
