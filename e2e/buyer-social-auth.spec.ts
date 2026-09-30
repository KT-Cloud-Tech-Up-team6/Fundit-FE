import { test, expect, type Page } from "@playwright/test";

/* 소셜 로그인: 로그인·회원가입 화면의 카카오/구글 버튼 → (가입 화면이면 약관) → 콜백 `/oauth/{provider}`.
   e2e 서버는 client ID를 비우고 MSW를 켜므로, 버튼이 제공자 화면 대신 목업 인가 코드로 콜백에 바로 간다
   (oauth-authorize.ts). 콜백의 각 갈래는 인가 코드로 고르는 auth-handlers.ts의 login/social 목업이 응답한다. */
const STATE = "e2e-state";

async function seedSession(
  page: Page,
  overrides: Partial<{ entry: string; provider: string; returnTo: string; state: string }> = {},
) {
  // sessionStorage는 origin 단위라 앱 화면을 한 번 연 뒤에 심는다.
  await page.goto("/auth/login");
  /* MSW는 워커가 등록돼 있는데 페이지가 아직 워커의 제어를 받지 않으면 location.reload()한다(dev 전용).
     1회용 state를 심은 뒤 콜백을 열 때 그 리로드가 끼면 state가 이미 소비돼 있으므로, 제어를 받은 뒤에 진행한다. */
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await page.evaluate(
    (session) => sessionStorage.setItem("fundit-auth-social", JSON.stringify(session)),
    {
      agreedTerms: [],
      entry: "login",
      expiresAt: Date.now() + 60_000,
      provider: "KAKAO",
      returnTo: "/",
      state: STATE,
      ...overrides,
    },
  );
}

function trackSocialRequests(page: Page) {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/v1/auth/login/social")) requests.push(request.url());
  });
  return requests;
}

test("카카오 로그인 버튼으로 기존 회원이 로그인해 홈으로 이동한다", async ({ page }) => {
  await page.goto("/auth/login");
  await Promise.all([
    page.waitForURL((url) => url.pathname === "/"),
    page.getByRole("button", { name: "카카오 로그인" }).click(),
  ]);
});

test("로그인 전 화면으로 돌아가는 returnTo를 소셜 로그인 뒤에도 지킨다", async ({ page }) => {
  await page.goto("/auth/login?returnTo=/my/fundings");
  await Promise.all([
    page.waitForURL((url) => url.pathname === "/my/fundings"),
    page.getByRole("button", { name: "구글 로그인" }).click(),
  ]);
});

test("회원가입 화면의 카카오 버튼은 약관 동의를 거친 뒤 소셜 인증으로 진행한다", async ({
  page,
}) => {
  await page.goto("/auth/signup");
  await page.getByRole("button", { name: "카카오 회원가입" }).click();

  // 약관은 OAuth 앞에서 받는다. 필수 항목을 동의하기 전에는 진행할 수 없다.
  const submit = page.getByRole("button", { name: "회원가입", exact: true });
  await expect(submit).toBeDisabled();
  const agreeAll = page.getByRole("checkbox", { name: /펀딧 이용 약관 동의 \(전체\)/ });
  await expect(agreeAll).toBeEnabled();
  await agreeAll.check({ force: true });

  await Promise.all([page.waitForURL((url) => url.pathname === "/"), submit.click()]);
});

test("state가 없으면 API를 호출하지 않고 다시 시작하도록 안내한다", async ({ page }) => {
  const requests = trackSocialRequests(page);
  await page.goto("/oauth/kakao?code=mock-existing&state=nobody");

  await expect(page.getByText("로그인 정보를 확인하지 못했어요")).toBeVisible();
  expect(requests).toHaveLength(0);
  await page.getByRole("button", { name: "로그인으로 가기" }).click();
  await expect(page).toHaveURL(/\/auth\/login/);
});

test("저장된 state와 다르면 API를 호출하지 않는다", async ({ page }) => {
  const requests = trackSocialRequests(page);
  await seedSession(page);
  await page.goto("/oauth/kakao?code=mock-existing&state=forged");

  await expect(page.getByText("로그인 정보를 확인하지 못했어요")).toBeVisible();
  expect(requests).toHaveLength(0);
});

test("다른 제공자의 콜백으로 들어오면 API를 호출하지 않는다", async ({ page }) => {
  const requests = trackSocialRequests(page);
  await seedSession(page, { provider: "KAKAO" });
  await page.goto(`/oauth/google?code=mock-existing&state=${STATE}`);

  await expect(page.getByText("로그인 정보를 확인하지 못했어요")).toBeVisible();
  expect(requests).toHaveLength(0);
});

test("state는 한 번만 쓸 수 있어 새로고침하면 다시 시작해야 한다", async ({ page }) => {
  await seedSession(page);
  await page.goto(`/oauth/kakao?code=mock-existing&state=${STATE}`);
  await page.waitForURL((url) => url.pathname === "/");

  await page.goto(`/oauth/kakao?code=mock-existing&state=${STATE}`);
  await expect(page.getByText("로그인 정보를 확인하지 못했어요")).toBeVisible();
});

test("동의 화면에서 취소하면 시작한 화면으로 돌아간다", async ({ page }) => {
  await seedSession(page, { entry: "login", returnTo: "/my/fundings" });
  await page.goto(`/oauth/kakao?error=access_denied&state=${STATE}`);
  await expect(page).toHaveURL(/\/auth\/login\?returnTo=/);

  await seedSession(page, { entry: "signup" });
  await page.goto(`/oauth/kakao?error=access_denied&state=${STATE}`);
  await expect(page).toHaveURL(/\/auth\/signup$/);
});

test("아직 가입되지 않은 소셜 계정은 준비 중 안내와 일반 회원가입 진입을 보여 준다", async ({
  page,
}) => {
  await seedSession(page);
  await page.goto(`/oauth/kakao?code=mock-signup&state=${STATE}`);

  await expect(page.getByText(/아직 가입되지 않은/)).toBeVisible();
  // 1회용 인가 코드와 state가 주소창에 남지 않는다.
  expect(new URL(page.url()).search).toBe("");
  await page.getByRole("button", { name: "일반 회원가입" }).click();
  await expect(page).toHaveURL(/\/auth\/signup$/);
});

test("이메일로 가입된 계정이 있으면 이메일 로그인을 안내한다", async ({ page }) => {
  await seedSession(page);
  await page.goto(`/oauth/kakao?code=mock-link&state=${STATE}`);

  await expect(page.getByText(/이미 이메일로 가입된/)).toBeVisible();
  await page.getByRole("button", { name: "이메일로 로그인" }).click();
  await expect(page).toHaveURL(/\/auth\/login$/);
});

test("다른 제공자로 가입된 이메일이면 그 제공자로 로그인하는 버튼을 보여 준다", async ({
  page,
}) => {
  await seedSession(page, { provider: "GOOGLE" });
  await page.goto(`/oauth/google?code=mock-exists&state=${STATE}`);

  // 409 detail.provider(KAKAO)를 따른다. 지금 시도한 GOOGLE이 아니다.
  await expect(page.getByText("이미 카카오 계정으로 가입된 이메일이에요.")).toBeVisible();
  await Promise.all([
    page.waitForURL((url) => url.pathname === "/"),
    page.getByRole("button", { name: "카카오로 로그인" }).click(),
  ]);
});

test("잠긴 계정이면 로그인 화면과 같은 문구를 보여 준다", async ({ page }) => {
  await seedSession(page);
  await page.goto(`/oauth/kakao?code=mock-locked&state=${STATE}`);

  await expect(page.getByText(/계정이 일시적으로 잠겼습니다/)).toBeVisible();
});

test("제공자·서버 실패는 원인을 구분하지 않고 다시 시도 버튼을 보여 준다", async ({ page }) => {
  await seedSession(page);
  await page.goto(`/oauth/kakao?code=mock-broken&state=${STATE}`);

  await expect(page.getByText("소셜 로그인에 실패했습니다. 다시 시도해 주세요.")).toBeVisible();
  // 다시 시도는 새 state로 인가를 처음부터 시작한다.
  await Promise.all([
    page.waitForURL((url) => url.pathname === "/"),
    page.getByRole("button", { name: "다시 시도" }).click(),
  ]);
});

test("비밀번호 변경이 필요한 계정은 일반 로그인처럼 변경 화면으로 보낸다", async ({ page }) => {
  await seedSession(page);
  await page.goto(`/oauth/kakao?code=mock-must-change-password&state=${STATE}`);

  await expect(page.getByLabel("현재 비밀번호")).toBeVisible();
});

test("지원하지 않는 제공자 주소는 404 화면을 보여 주고 API를 호출하지 않는다", async ({ page }) => {
  const requests = trackSocialRequests(page);
  await page.goto("/oauth/naver?code=x&state=y");

  // 루트 loading.tsx가 응답을 먼저 스트리밍해 상태 코드는 200이다. 화면과 noindex로 확인한다.
  await expect(page.getByText(/주소가 잘못되었을 수 있습니다/)).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
  expect(requests).toHaveLength(0);
});
