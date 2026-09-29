import { test, expect, type Page } from "@playwright/test";
import { E2E_LOGIN } from "../src/mocks/fixtures";

/* 로그인 가드: 이 저장소엔 middleware가 없고 인증이 전부 클라이언트 상태라, 비로그인 진입은
   화면이 직접 /auth/login?returnTo=…로 보낸다(LoginRedirect). 로그인 뒤 원래 화면으로 돌아와야 한다. */
async function submitEmailLogin(page: Page, email: string, password: string) {
  await page.getByRole("button", { name: "이메일로 로그인" }).click();
  await page.getByLabel("이메일").fill(email);
  await page.getByLabel("비밀번호").fill(password);
  await page.getByRole("button", { name: "로그인" }).click();
}

const guardedPaths = ["/my/fundings", "/my/refunds?type=cancel", "/seller/projects"];

for (const path of guardedPaths) {
  test(`비로그인으로 ${path}에 들어가면 로그인 뒤 같은 화면으로 돌아온다`, async ({ page }) => {
    await page.goto(path);

    await expect(page).toHaveURL(/\/auth\/login\?returnTo=/);
    expect(new URL(page.url()).searchParams.get("returnTo")).toBe(path);

    await submitEmailLogin(page, E2E_LOGIN.email, E2E_LOGIN.password);

    await expect(page).toHaveURL(
      (url) => url.pathname + url.search === path && !url.pathname.startsWith("/auth"),
    );
  });
}

test("잘못된 비밀번호면 안내하고 로그인 화면에 머문다", async ({ page }) => {
  await page.goto("/auth/login");
  await submitEmailLogin(page, E2E_LOGIN.email, "Wrong-passw0rd!");

  await expect(page.getByText("입력하신 계정 정보가 일치하지 않습니다.")).toBeVisible();
  await expect(page).toHaveURL(/\/auth\/login/);
});

test("비밀번호가 비어 있으면 로그인 버튼이 막히고 Enter로도 제출되지 않는다", async ({ page }) => {
  let loginRequests = 0;
  page.on("request", (request) => {
    if (request.url().includes("/api/v1/auth/login")) loginRequests += 1;
  });
  await page.goto("/auth/login");
  await page.getByRole("button", { name: "이메일로 로그인" }).click();
  const email = page.getByLabel("이메일", { exact: true });
  await email.fill(E2E_LOGIN.email);

  await expect(page.getByRole("button", { name: "로그인", exact: true })).toBeDisabled();
  await email.press("Enter");

  await expect(page).toHaveURL(/\/auth\/login/);
  await expect(page.getByText("입력하신 계정 정보가 일치하지 않습니다.")).not.toBeVisible();
  expect(loginRequests).toBe(0);
});

/* 외부 주소나 로그인 화면으로 되돌리는 returnTo는 무시하고 홈으로 보낸다(open redirect 방지). */
for (const returnTo of ["//evil.example/phish", "https://evil.example", "/auth/login", "/admin"]) {
  test(`안전하지 않은 returnTo(${returnTo})는 무시하고 로그인 뒤 홈으로 간다`, async ({ page }) => {
    await page.goto(`/auth/login?${new URLSearchParams({ returnTo })}`);
    await submitEmailLogin(page, E2E_LOGIN.email, E2E_LOGIN.password);

    await expect(page).toHaveURL((url) => url.pathname === "/");
    expect(new URL(page.url()).origin).toBe("http://localhost:3000");
  });
}
