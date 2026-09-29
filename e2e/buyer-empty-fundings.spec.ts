import { test, expect } from "@playwright/test";
import { loginAsFixtureUser } from "./support/login";
import { seedOrders } from "./support/orders";

/* 예외케이스 소비자 25: 참여한 프로젝트가 없으면 빈 상태를 보여 준다. */
test("참여한 프로젝트가 없으면 펀딩 내역이 빈 상태로 열린다", async ({ page }) => {
  await seedOrders(page, []);
  await loginAsFixtureUser(page);

  await page.goto("/my/fundings");

  await expect(page.getByText("총 0개")).toBeVisible();
  await expect(page.getByText("참여 내역이 없습니다.")).toBeVisible();
});
