import { test, expect } from "@playwright/test";
import { loginAsFixtureUser } from "./support/login";

/* 예외케이스 판매자 10: 필수 항목(제목·목표 금액)을 채우기 전에는 저장할 수 없고 입력값은 유지된다. */
test("필수 항목이 비어 있으면 저장할 수 없고, 채우면 저장할 수 있다", async ({ page }) => {
  await loginAsFixtureUser(page);
  await page.goto("/seller/projects/new");
  await page.getByRole("checkbox", { name: "약관 전체 동의" }).check({ force: true });
  await page.getByRole("button", { name: "동의하기" }).click();

  const save = page.getByRole("button", { name: "저장", exact: true });
  await expect(save).toBeDisabled();

  // 임시저장은 입력이 하나도 없으면 안내 문구만 띄우고 요청을 보내지 않는다.
  await page.getByRole("button", { name: "임시저장" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "저장할 기본 정보를 입력해주세요." }),
  ).toBeVisible();

  const title = page.getByPlaceholder("프로젝트 제목을 입력해주세요");
  await title.fill("E2E 필수 항목 프로젝트");
  await expect(save).toBeDisabled();

  // 최소 목표 금액(500,000원) 미만이면 계속 막힌다. 그동안 입력한 제목은 그대로다.
  const amount = page.getByLabel("목표 금액");
  await amount.fill("1000");
  await expect(save).toBeDisabled();
  await expect(title).toHaveValue("E2E 필수 항목 프로젝트");

  await amount.fill("600000");
  await expect(save).toBeEnabled();
});
