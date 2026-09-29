import { test, expect } from "@playwright/test";
import { loginAsFixtureUser } from "./support/login";
import { FIXTURE_ORDER_ID } from "@/mocks/fixtures";

test("펀딩 취소를 신청하면 취소/환불 내역에 반영된다", async ({ page }) => {
  await loginAsFixtureUser(page);

  await page.goto("/my/fundings");
  await expect(page.getByRole("heading", { name: "감성 캠핑 무드등 세트" })).toBeVisible();

  await Promise.all([
    page.waitForURL(new RegExp(`/my/fundings/${FIXTURE_ORDER_ID}$`)),
    page.getByRole("link", { name: "펀딩 상세" }).click(),
  ]);

  await Promise.all([
    page.waitForURL(new RegExp(`/my/fundings/${FIXTURE_ORDER_ID}/cancel`)),
    page.getByRole("link", { name: "참여 취소" }).click(),
  ]);

  await page.getByRole("button", { name: "취소 사유" }).click();
  await page.getByRole("option", { name: "단순 변심" }).click();

  await page.getByRole("button", { name: "취소 신청" }).click();
  const dialog = page.locator("dialog");
  await expect(dialog).toBeVisible();
  await Promise.all([
    page.waitForURL(new RegExp(`/my/fundings/${FIXTURE_ORDER_ID}$`)),
    dialog.getByRole("button", { name: "취소 신청" }).click(),
  ]);
  await expect(page.getByRole("link", { name: "참여 취소" })).not.toBeVisible();

  await page.goto("/my/refunds");
  await expect(page.getByRole("heading", { name: "감성 캠핑 무드등 세트" })).toBeVisible();
});
