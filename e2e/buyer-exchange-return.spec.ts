import { test, expect, type Page } from "@playwright/test";
import { loginAsFixtureUser } from "./support/login";
import { DELIVERED_ORDER_TITLE, deliveredOrder, seedOrders } from "./support/orders";
import { FIXTURE_DELIVERED_ORDER_ID } from "../src/mocks/fixtures";

/* UCS 소비자 34~37: 배송 완료 뒤 펀딩 내역에서 교환/반품을 신청하고 내역에서 확인한다. */
async function requestFromList(page: Page, type: "교환" | "반품", reason: string) {
  await seedOrders(page, [deliveredOrder()]);
  await loginAsFixtureUser(page);

  await page.goto("/my/fundings");
  await expect(page.getByRole("heading", { name: DELIVERED_ORDER_TITLE })).toBeVisible();
  await Promise.all([
    page.waitForURL(new RegExp(`/my/fundings/${FIXTURE_DELIVERED_ORDER_ID}/refund/new`)),
    page.getByRole("link", { name: "반품·교환 신청" }).click(),
  ]);

  await page.getByRole("button", { name: "유형", exact: true }).click();
  await page.getByRole("option", { name: type, exact: true }).click();
  await page.getByRole("button", { name: "사유", exact: true }).click();
  await page.getByRole("option", { name: reason, exact: true }).click();

  await page.getByRole("button", { name: `${type} 신청` }).click();
  const dialog = page.locator("dialog");
  await expect(dialog).toBeVisible();
  await Promise.all([
    page.waitForURL(/\/my\/refunds/),
    dialog.getByRole("button", { name: `${type} 신청` }).click(),
  ]);
  await expect(page.getByRole("heading", { name: DELIVERED_ORDER_TITLE })).toBeVisible();
}

test("교환을 신청하면 취소/반품/교환 내역에 진행 중으로 반영된다", async ({ page }) => {
  await requestFromList(page, "교환", "옵션 선택 오류");
  await expect(page.getByText("교환 진행 중")).toBeVisible();
});

test("반품을 신청하면 취소/반품/교환 내역에 진행 중으로 반영되고 신청 버튼은 내역 버튼으로 바뀐다", async ({
  page,
}) => {
  await requestFromList(page, "반품", "단순 변심");
  await expect(page.getByText("반품 진행 중")).toBeVisible();

  await page.goto("/my/fundings");
  await expect(page.getByRole("link", { name: "반품·교환 신청" })).not.toBeVisible();
  await expect(page.getByRole("link", { name: "반품·교환 내역" })).toBeVisible();
});
