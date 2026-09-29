import { test, expect } from "@playwright/test";
import { loginAsFixtureUser } from "./support/login";
import { FIXTURE_PROJECT_ID } from "@/mocks/fixtures";

test("구매자가 로그인부터 결제 진입 직전까지 펀딩 참여를 완료한다", async ({ page }) => {
  await loginAsFixtureUser(page);

  await page.goto(`/projects/${FIXTURE_PROJECT_ID}`);
  await expect(page.getByRole("heading", { name: "감성 캠핑 무드등 세트" })).toBeVisible();

  await page.getByRole("button", { name: /^리워드 \(\d+개\)$/ }).click();
  await page
    .getByRole("group", { name: "리워드 목록" })
    .getByRole("button", { name: /기본 무드등 1개/ })
    .click();
  await page.getByRole("button", { name: "펀딩하기" }).click();

  await expect(page).toHaveURL(/\/funding\/.+\/checkout/);
  await expect(page.getByRole("button", { name: /결제하기|결제$/ })).toBeVisible();

  await page.getByRole("button", { name: "쿠폰 적용" }).click();
  const couponSheet = page.getByRole("dialog", { name: "쿠폰 선택" });
  await couponSheet.getByRole("checkbox", { name: "5,000원 할인 쿠폰" }).check({ force: true });
  await couponSheet.getByRole("button", { name: "적용" }).click();

  await expect(page.getByText("쿠폰 1개 사용중")).toBeVisible();
  await expect(page.getByRole("button", { name: "34,000원 결제" })).toBeVisible();

  await page.getByRole("button", { name: /결제하기|결제$/ }).click();

  await expect(page).toHaveURL(/\/payment\/.+/);
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "결제 환경이 설정되지 않아 결제를 진행할 수 없습니다." }),
  ).toBeVisible();
});
