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

test.describe("모바일 리워드 선택 시트", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("닫기 버튼에서 시작한 누름은 끌기로 받지 않고, 제목 줄은 끌어 내려 닫을 수 있다", async ({
    page,
  }) => {
    await page.goto(`/projects/${FIXTURE_PROJECT_ID}`);
    await page.getByRole("button", { name: "펀딩하기" }).click();
    const sheet = page.getByRole("dialog", { name: "리워드 선택" });
    await expect(sheet).toBeVisible();
    // 리워드 선택 시트는 아래에서 밀려 올라오므로 열림 전환이 끝난 뒤 위치를 잰다.
    await sheet.evaluate((element) =>
      Promise.all(element.getAnimations().map((animation) => animation.finished)),
    );
    const box = (await sheet.boundingBox())!;
    const close = (await sheet.getByRole("button", { name: "리워드 선택 닫기" }).boundingBox())!;
    const title = (await sheet.getByRole("heading", { name: "리워드 선택" }).boundingBox())!;

    // 닫기 버튼을 누른 채 시트 밖으로 끌어 놓은 뒤, 누르지 않고 제목 줄 위를 지나가도 시트가 움직이지 않는다(#509 리뷰).
    await page.mouse.move(close.x + close.width / 2, close.y + close.height / 2);
    await page.mouse.down();
    await page.mouse.move(close.x + close.width / 2, box.y - 100, { steps: 8 });
    await page.mouse.up();
    await page.mouse.move(title.x + 10, title.y + 2);
    await page.mouse.move(title.x + 10, title.y + 40, { steps: 6 });
    await expect(sheet).toBeVisible();
    expect((await sheet.boundingBox())!.y).toBe(box.y);

    // 제목 줄을 닫힘 기준(시트 높이의 1/4, 최대 120px)보다 더 끌고 놓으면 닫힌다(#508).
    await page.mouse.move(title.x + 10, title.y + title.height / 2);
    await page.mouse.down();
    await page.mouse.move(title.x + 10, title.y + Math.min(120, box.height / 4) + 40, {
      steps: 8,
    });
    await page.mouse.up();
    await expect(sheet).toBeHidden();
  });
});
