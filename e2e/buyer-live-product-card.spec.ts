import { test, expect } from "@playwright/test";
import { loginAsFixtureUser } from "./support/login";
import {
  FIXTURE_ENDED_LIVE_ID,
  FIXTURE_ON_AIR_LIVE_ID,
  FIXTURE_PROJECT_ID,
  FIXTURE_REWARD_ID,
} from "@/mocks/fixtures";

/* UCS 소비자 20~21, Figma 소비자 핵심 플로우(1087:18097): 방송을 보다가 상품 카드로 프로젝트 상세와 리워드 선택에
   간다. 실제 방송 경로에는 카드가 없어 구매로 넘어갈 수 없었다(#555). */
const projectTitle = "감성 캠핑 무드등 세트";
const detailPath = `/projects/${FIXTURE_PROJECT_ID}?tab=story`;

test.describe("모바일 LIVE 상품 카드", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("연결 프로젝트를 보이고, 누르면 프로젝트 상세로 간다", async ({ page }) => {
    await page.goto(`/live/${FIXTURE_ON_AIR_LIVE_ID}`);

    await expect(page.getByRole("heading", { level: 1, name: projectTitle })).toBeVisible();
    await expect(page.getByText("39,000원")).toBeVisible();
    await expect(page.getByRole("button", { name: "리워드 3개 더보기" })).toHaveText("3+더보기");

    await page.getByRole("link", { name: `${projectTitle} 프로젝트 상세 보기` }).click();
    await expect(page).toHaveURL(detailPath);
    await expect(page.getByRole("heading", { name: projectTitle })).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(`/live/${FIXTURE_ON_AIR_LIVE_ID}`);
  });

  test("더보기로 리워드를 골라 주문서로 간다", async ({ page }) => {
    await loginAsFixtureUser(page);
    await page.goto(`/live/${FIXTURE_ON_AIR_LIVE_ID}`);

    await page.getByRole("button", { name: "리워드 3개 더보기" }).click();
    const sheet = page.getByRole("dialog", { name: "리워드 선택" });
    await expect(sheet).toBeVisible();
    await sheet.getByRole("button", { name: /^리워드 \(\d+개\)$/ }).click();
    await sheet
      .getByRole("group", { name: "리워드 목록" })
      .getByRole("button", { name: /기본 무드등 1개/ })
      .click();
    await sheet.getByRole("button", { name: "펀딩하기" }).click();

    await expect(page).toHaveURL(new RegExp(`/funding/${FIXTURE_PROJECT_ID}/checkout\\?items=`));
    const items = JSON.parse(new URL(page.url()).searchParams.get("items")!);
    expect(items).toEqual([{ rewardId: FIXTURE_REWARD_ID, quantity: 1, optionValueIds: [] }]);
  });

  test("다시보기에도 카드가 있다", async ({ page }) => {
    await page.goto(`/live/${FIXTURE_ENDED_LIVE_ID}?mode=replay`);

    await expect(page.getByRole("heading", { level: 1, name: projectTitle })).toBeVisible();
    await page.getByRole("link", { name: `${projectTitle} 프로젝트 상세 보기` }).click();
    await expect(page).toHaveURL(detailPath);
  });
});

test("데스크톱 LIVE 오른쪽 열에 리워드 목록과 상세 이동이 있다", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`/live/${FIXTURE_ON_AIR_LIVE_ID}`);

  const rewards = page.getByRole("region", { name: "리워드 안내" });
  await expect(rewards.getByText("총 3개")).toBeVisible();
  await expect(rewards.getByRole("heading", { name: "기본 무드등 1개" })).toBeVisible();

  await rewards.getByRole("link", { name: "상세 정보 보기" }).click();
  await expect(page).toHaveURL(detailPath);
});
