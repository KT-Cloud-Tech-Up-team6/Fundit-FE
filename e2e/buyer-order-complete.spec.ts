import { test, expect } from "@playwright/test";
import { loginAsFixtureUser } from "./support/login";
import { FIXTURE_PROJECT_ID } from "@/mocks/fixtures";

/* UCS 소비자 26~30: 리워드 선택 → 주문서 → 결제 → 주문 완료.
   Toss 위젯은 E2E에서 띄우지 않으므로 결제창이 돌려주는 복귀 URL(successUrl/failUrl)을 직접 연다. */
async function startPayment(page: import("@playwright/test").Page) {
  await page.goto(`/projects/${FIXTURE_PROJECT_ID}`);
  await page.getByRole("button", { name: /^리워드 \(\d+개\)$/ }).click();
  await page
    .getByRole("group", { name: "리워드 목록" })
    .getByRole("button", { name: /기본 무드등 1개/ })
    .click();
  await page.getByRole("button", { name: "펀딩하기" }).click();
  await page.getByRole("button", { name: /결제하기|결제$/ }).click();
  await page.waitForURL(/\/payment\/[^/]+$/);
  return new URL(page.url()).pathname.split("/").pop()!;
}

test("UCS 소비자 30: 결제 승인이 끝나면 주문 완료(펀딩 상세)로 이동한다", async ({ page }) => {
  await loginAsFixtureUser(page);
  const orderId = await startPayment(page);

  await page.goto(`/payment/result?paymentKey=e2e-key&orderId=pg-${orderId}&amount=39000`);

  await expect(page).toHaveURL(new RegExp(`/payment/result\\?orderId=${orderId}$`));
  await expect(page.getByRole("heading", { name: "감성 캠핑 무드등 세트" })).toBeVisible();
});

test("UCS 소비자 30: 승인 금액이 주문 금액과 다르면 승인하지 않고 재결제를 안내한다", async ({
  page,
}) => {
  await loginAsFixtureUser(page);
  const orderId = await startPayment(page);
  // 결제 화면이 기억해 두는 시도 정보. Toss 키가 없는 E2E는 이 화면이 저장하지 않아 직접 심는다.
  await page.evaluate((id) => {
    sessionStorage.setItem(
      `fundit-payment-attempt:pg-${id}`,
      JSON.stringify({ orderId: id, amount: 39_000 }),
    );
  }, orderId);

  await page.goto(`/payment/result?paymentKey=e2e-key&orderId=pg-${orderId}&amount=1000`);

  await expect(
    page.getByRole("alert").filter({ hasText: "결제 금액이 주문 금액과 달라" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "다시 결제하기" })).toHaveAttribute(
    "href",
    `/payment/${orderId}`,
  );
});

test("UCS 소비자 29: 결제창을 닫으면 취소 안내와 함께 마지막 주문으로 다시 결제할 수 있다", async ({
  page,
}) => {
  await loginAsFixtureUser(page);
  const orderId = await startPayment(page);
  await page.evaluate((id) => sessionStorage.setItem("fundit-payment-last-attempt", id), orderId);

  await page.goto("/payment/result?code=PAY_PROCESS_CANCELED&message=user-cancel");

  await expect(page.getByRole("alert").filter({ hasText: "결제를 취소했습니다." })).toBeVisible();
  await expect(page.getByRole("link", { name: "다시 결제하기" })).toHaveAttribute(
    "href",
    `/payment/${orderId}`,
  );
});
