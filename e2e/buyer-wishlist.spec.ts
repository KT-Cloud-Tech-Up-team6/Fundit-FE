import { test, expect } from "@playwright/test";
import { loginAsFixtureUser } from "./support/login";
import { FIXTURE_PROJECT_ID } from "@/mocks/fixtures";

/* 소비자 탐색: 관심 목록(찜 프로젝트·팔로잉). 응답은 src/mocks/discovery-handlers.ts가 만든다. */
test.beforeEach(async ({ page }) => {
  await loginAsFixtureUser(page);
  await page.goto("/my/wishlist");
});

test("찜한 프로젝트를 보고, 공개 전 프로젝트는 상세 연결 없이 안내한다", async ({ page }) => {
  await expect(page.getByText("총 2개")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "감성 캠핑 무드등 세트", exact: true }),
  ).toHaveAttribute("href", `/projects/${FIXTURE_PROJECT_ID}`);
  await expect(page.getByText("공개 준비 중인 프로젝트")).toBeVisible();
  await expect(page.getByText("프로젝트 정보를 준비 중입니다.")).toBeVisible();
});

test("찜을 해제하고 다시 등록할 수 있다", async ({ page }) => {
  await page.getByRole("button", { name: "감성 캠핑 무드등 세트 찜 해제" }).click();

  await expect(page.getByRole("status").filter({ hasText: "찜을 해제했습니다." })).toBeVisible();
  await expect(page.getByText("총 1개")).toBeVisible();

  await page.getByRole("button", { name: "찜 다시 등록" }).click();

  await expect(page.getByText("총 2개")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "감성 캠핑 무드등 세트", exact: true }),
  ).toBeVisible();
});

test("팔로잉 탭에서 팔로우를 해제하고 다시 팔로우할 수 있다", async ({ page }) => {
  await page.getByRole("tab", { name: "팔로잉" }).click();

  await expect(page).toHaveURL(/tab=sellers/);
  await expect(page.getByRole("article", { name: "무드등 공방" })).toBeVisible();

  await page.getByRole("button", { name: "무드등 공방 팔로우 해제" }).click();

  // 해제한 행은 목록에 남고 버튼이 "다시 팔로우"로 바뀐다.
  const refollow = page.getByRole("button", { name: "무드등 공방 다시 팔로우" });
  await expect(refollow).toBeVisible();

  await refollow.click();

  await expect(page.getByRole("button", { name: "무드등 공방 팔로우 해제" })).toBeVisible();
});
