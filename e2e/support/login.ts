import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { E2E_LOGIN } from "@/mocks/fixtures";

export async function loginAsFixtureUser(page: Page) {
  await page.goto("/auth/login");
  await page.getByRole("button", { name: "이메일로 로그인" }).click();
  await page.getByLabel("이메일").fill(E2E_LOGIN.email);
  await page.getByLabel("비밀번호").fill(E2E_LOGIN.password);
  const submit = page.getByRole("button", { name: "로그인" });
  await submit.click();
  try {
    await page.waitForURL((url) => !url.pathname.startsWith("/auth/login"), { timeout: 8_000 });
  } catch {
    // ponytail: dev 서버 첫 컴파일 지연 등 드문 타이밍 실패를 한 번 재시도로 흡수한다.
    await submit.click();
    await page.waitForURL((url) => !url.pathname.startsWith("/auth/login"), { timeout: 8_000 });
  }
  await expect(page.getByRole("button", { name: "로그인" })).not.toBeVisible();
}
