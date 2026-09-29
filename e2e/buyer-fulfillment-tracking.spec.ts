import { test, expect } from "@playwright/test";
import { loginAsFixtureUser } from "./support/login";
import { FULFILLMENT_ORDER_ID, fundedOrder, seedOrders } from "./support/orders";
import { FIXTURE_SELLER_PROJECT_ID } from "@/mocks/fixtures";

/* UCS 소비자 32: 판매자가 갱신한 제작·배송 진행이 구매자의 제작·배송 현황(5단계)에 반영된다.
   같은 픽스처 계정이 두 역할을 다 하고, 진행 상태는 sessionStorage로 이어진다(fulfillment-handlers.ts). */
test.beforeEach(async ({ page }) => {
  await seedOrders(page, [fundedOrder()]);
  await loginAsFixtureUser(page);
});

test("판매자가 단계를 넘기면 구매자에게 5단계 진행 상태가 바뀌어 보인다", async ({ page }) => {
  const buyerView = `/my/fundings/${FULFILLMENT_ORDER_ID}/fulfillment`;

  await page.goto(buyerView);
  await expect(page.getByRole("heading", { name: "현재 제작 착수 단계입니다." })).toBeVisible();
  await expect(page.getByRole("listitem", { name: "제작 착수 단계, 진행 중" })).toBeVisible();
  await expect(page.getByRole("listitem", { name: "생산 단계, 진행 전" })).toBeVisible();

  await page.goto(`/seller/projects/${FIXTURE_SELLER_PROJECT_ID}?tab=fulfillment`);
  await page.getByRole("button", { name: "제작 착수 완료하고 생산 시작" }).click();
  await expect(page.getByText("현재 단계. 생산")).toBeVisible();

  await page.goto(buyerView);
  await expect(page.getByRole("heading", { name: "현재 생산 단계입니다." })).toBeVisible();
  await expect(page.getByRole("listitem", { name: "제작 착수 단계, 진행 완료" })).toBeVisible();
  await expect(page.getByRole("listitem", { name: "생산 단계, 진행 중" })).toBeVisible();
  await expect(page.getByRole("listitem", { name: /^검수 단계, 진행 전/ })).toBeVisible();
});

test("판매자가 발송 처리하면 구매자 배송 현황에 택배사·송장번호가 보인다", async ({ page }) => {
  const buyerView = `/my/fundings/${FULFILLMENT_ORDER_ID}/fulfillment`;

  await page.goto(buyerView);
  await expect(page.getByText("배송 준비")).toBeVisible();

  await page.goto(`/seller/projects/${FIXTURE_SELLER_PROJECT_ID}/shipping`);
  const row = page.getByRole("row", { name: /김서포터/ });
  await row.getByRole("combobox", { name: /택배사/ }).selectOption("CJ대한통운");
  await row.getByRole("textbox", { name: /운송장 번호/ }).fill("123456789012");
  await row.getByRole("button", { name: "발송 처리" }).click();
  await expect(page.getByText("1건을 발송 처리했어요.")).toBeVisible();

  await page.goto(buyerView);
  await expect(page.getByText("발송 완료", { exact: true })).toBeVisible();
  await expect(page.getByText("택배사 CJ대한통운")).toBeVisible();
  await expect(page.getByText("송장번호 123456789012")).toBeVisible();
});
