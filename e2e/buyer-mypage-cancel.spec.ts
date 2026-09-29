import { test, expect, type Page } from "@playwright/test";
import { loginAsFixtureUser } from "./support/login";
import { FIXTURE_ORDER_ID } from "@/mocks/fixtures";

async function cancelFixtureOrder(page: Page, reason: string) {
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
  await page.getByRole("option", { name: reason }).click();

  await page.getByRole("button", { name: "취소 신청" }).click();
  const dialog = page.locator("dialog");
  await expect(dialog).toBeVisible();
  await Promise.all([
    page.waitForURL(new RegExp(`/my/fundings/${FIXTURE_ORDER_ID}$`)),
    dialog.getByRole("button", { name: "취소 신청" }).click(),
  ]);
  await expect(page.getByRole("link", { name: "참여 취소" })).not.toBeVisible();
}

test("펀딩 취소를 신청하면 취소/환불 내역에 반영된다", async ({ page }) => {
  await cancelFixtureOrder(page, "단순 변심");

  await page.goto("/my/refunds");
  await expect(page.getByRole("heading", { name: "감성 캠핑 무드등 세트" })).toBeVisible();
});

// 취소 사유가 무엇이든 유형은 "취소"다. 사유는 유형이 아니라 사유 문구로 보인다.
test("단순 변심이 아닌 사유로 취소해도 취소 유형으로 분류되고 사유가 보인다", async ({ page }) => {
  await cancelFixtureOrder(page, "옵션 선택 오류");

  await page.goto("/my/refunds");
  await expect(page.getByText("취소 진행 중")).toBeVisible();
  // 사유는 접힌 상세 영역에 있어 화면에는 숨겨져 있다. 사유 유형이 실려 왔는지만 본다.
  await expect(page.getByText("옵션 선택 오류")).toBeAttached();

  await page.goto("/my/refunds?type=cancel");
  await expect(page.getByRole("heading", { name: "감성 캠핑 무드등 세트" })).toBeVisible();
});
