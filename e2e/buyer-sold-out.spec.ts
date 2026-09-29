import { test, expect } from "@playwright/test";
import { loginAsFixtureUser } from "./support/login";
import { FIXTURE_PROJECT_ID } from "@/mocks/fixtures";

/* 예외케이스 소비자 18·19: 리워드 재고가 없는 경우. */
test("품절 리워드는 선택할 수 없다", async ({ page }) => {
  await page.goto(`/projects/${FIXTURE_PROJECT_ID}`);
  await page.getByRole("button", { name: /^리워드 \(\d+개\)$/ }).click();

  const soldOut = page
    .getByRole("group", { name: "리워드 목록" })
    .getByRole("button", { name: /품절 무드등 1개/ });
  await expect(soldOut).toBeDisabled();
  await expect(soldOut).toContainText("품절");
});

test("결제 직전에 재고가 소진되면 주문하지 못하고 수량 확인을 안내한다", async ({ page }) => {
  await loginAsFixtureUser(page);
  await page.goto(`/projects/${FIXTURE_PROJECT_ID}`);
  await page.getByRole("button", { name: /^리워드 \(\d+개\)$/ }).click();
  await page
    .getByRole("group", { name: "리워드 목록" })
    .getByRole("button", { name: /한정 무드등 1개/ })
    .click();
  await page.getByRole("button", { name: "펀딩하기" }).click();
  await expect(page).toHaveURL(/\/funding\/.+\/checkout/);

  await page.getByRole("button", { name: /결제하기|결제$/ }).click();

  // 데스크톱 레이아웃은 결제 요약을 본문과 사이드바에 함께 그려 같은 알림이 둘 나온다.
  await expect(
    page.getByRole("alert").filter({ hasText: "남은 수량이 부족한 리워드가 있어" }).first(),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/checkout/);
});
