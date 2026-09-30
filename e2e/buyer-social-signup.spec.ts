import { test, expect, type Page } from "@playwright/test";

/* 소셜 신규 가입: 콜백이 미가입(needsSignup)으로 판정하면 /auth/signup/social 폼으로 이어지고,
   signup/social 제출 뒤 일반 가입과 같은 완료 화면으로 간다. 제공자와 BE는 auth-handlers.ts의 목업이 대신한다.
   인가 코드로 login/social 응답을 고른다: mock-signup(이메일 있음), mock-signup-no-email(카카오 이메일 없음),
   mock-signup-expired·broken·conflict(가입 요청 단계의 실패 갈래). */
const STATE = "e2e-state";

/* 진입 화면(entry)과 OAuth 앞에서 받은 약관 코드까지 심고 콜백을 연다. 실제로는 소셜 버튼이 하는 일이다. */
async function openCallback(
  page: Page,
  code: string,
  session: {
    agreedTerms?: string[];
    entry?: "login" | "signup";
    provider?: "GOOGLE" | "KAKAO";
  } = {},
) {
  await page.goto("/auth/login");
  /* MSW는 워커가 등록돼 있는데 페이지가 아직 워커의 제어를 받지 않으면 location.reload()한다(dev 전용).
     1회용 state를 심은 뒤 콜백을 열 때 그 리로드가 끼면 state가 이미 소비돼 있으므로, 제어를 받은 뒤에 진행한다. */
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  const provider = session.provider ?? "KAKAO";
  await page.evaluate(
    (value) => sessionStorage.setItem("fundit-auth-social", JSON.stringify(value)),
    {
      agreedTerms: session.agreedTerms ?? [],
      entry: session.entry ?? "login",
      expiresAt: Date.now() + 60_000,
      provider,
      returnTo: "/",
      state: STATE,
    },
  );
  await page.goto(`/oauth/${provider.toLowerCase()}?code=${code}&state=${STATE}`);
}

const ALL_REQUIRED_TERMS = ["SERVICE_USE", "PRIVACY", "AGE_OVER_14"];

function trackSignupRequests(page: Page) {
  const bodies: Record<string, unknown>[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/v1/auth/signup/social") && request.method() === "POST")
      bodies.push(request.postDataJSON());
  });
  return bodies;
}

test("가입 화면에서 진입하면 약관을 다시 묻지 않고 폼으로 이어져 가입을 마친다", async ({
  page,
}) => {
  const requests = trackSignupRequests(page);
  await openCallback(page, "mock-signup", {
    agreedTerms: ALL_REQUIRED_TERMS,
    entry: "signup",
    provider: "GOOGLE",
  });

  await expect(page).toHaveURL(/\/auth\/signup\/social$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  // 제공자가 준 이메일은 읽기 전용이고, 구글의 name은 이름 칸에 들어간다. 닉네임(공개 값)은 비워 둔다.
  await expect(page.getByLabel("이메일", { exact: true })).toHaveValue("social@fundit.test");
  await expect(page.getByLabel("이메일", { exact: true })).toHaveJSProperty("readOnly", true);
  await expect(page.getByLabel("이름", { exact: true })).toHaveValue("소셜 사용자");
  await expect(page.getByLabel("닉네임", { exact: true })).toHaveValue("");

  const submit = page.getByRole("button", { name: "가입하기" });
  await expect(submit).toBeDisabled();
  await page.getByLabel("닉네임", { exact: true }).fill("펀딧러");
  await expect(submit).toBeDisabled();
  await page.getByLabel("휴대폰 번호", { exact: true }).fill("010-1234-5678");
  // 하이픈은 걸러지고 숫자만 남는다.
  await expect(page.getByLabel("휴대폰 번호", { exact: true })).toHaveValue("01012345678");
  await expect(submit).toBeEnabled();

  await Promise.all([page.waitForURL(/\/auth\/signup\/complete$/), submit.click()]);
  expect(requests).toHaveLength(1);
  expect(requests[0]).toMatchObject({
    agreedTerms: ALL_REQUIRED_TERMS,
    name: "소셜 사용자",
    nickname: "펀딧러",
    phoneNumber: "01012345678",
    signupToken: "mock-signup-token",
  });
  // 제공자 이메일이 있으면 보내지 않는다(BE가 제공자 값을 우선한다).
  expect(requests[0]).not.toHaveProperty("email");
});

test("카카오는 닉네임 칸에 name을 채우고 이메일이 없으면 직접 입력받는다", async ({ page }) => {
  const requests = trackSignupRequests(page);
  await openCallback(page, "mock-signup-no-email", {
    agreedTerms: ALL_REQUIRED_TERMS,
    entry: "signup",
    provider: "KAKAO",
  });

  await expect(page).toHaveURL(/\/auth\/signup\/social$/);
  await expect(page.getByLabel("닉네임", { exact: true })).toHaveValue("카카오유저");
  await expect(page.getByLabel("이름", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("이메일", { exact: true })).toBeEditable();

  await page.getByLabel("이름", { exact: true }).fill("홍길동");
  await page.getByLabel("휴대폰 번호", { exact: true }).fill("01012345678");
  const submit = page.getByRole("button", { name: "가입하기" });
  await expect(submit).toBeDisabled();
  await page.getByLabel("이메일", { exact: true }).fill("형식이아님");
  await expect(submit).toBeDisabled();

  // 중복 이메일은 가입 요청을 보내기 전에 막는다. 토큰이 소비되기 전이라 그대로 다시 입력할 수 있다.
  await page.getByLabel("이메일", { exact: true }).fill("taken@fundit.test");
  await submit.click();
  await expect(page.getByText("이미 가입된 주소입니다.")).toBeVisible();
  expect(requests).toHaveLength(0);

  await page.getByLabel("이메일", { exact: true }).fill("kakao.user@fundit.test");
  await Promise.all([page.waitForURL(/\/auth\/signup\/complete$/), submit.click()]);
  expect(requests).toHaveLength(1);
  expect(requests[0]).toMatchObject({
    email: "kakao.user@fundit.test",
    name: "홍길동",
    nickname: "카카오유저",
  });
});

test("로그인 화면에서 진입한 미가입 계정은 폼에서 약관을 받는다", async ({ page }) => {
  const requests = trackSignupRequests(page);
  await openCallback(page, "mock-signup", { entry: "login", provider: "GOOGLE" });

  await expect(page).toHaveURL(/\/auth\/signup\/social$/);
  const sheet = page.getByRole("dialog", { name: "약관 동의" });
  await expect(sheet).toBeVisible();

  const agreeAll = sheet.getByRole("checkbox", { name: /펀딧 이용 약관 동의 \(전체\)/ });
  await expect(agreeAll).toBeEnabled();
  await agreeAll.check({ force: true });
  await sheet.getByRole("button", { name: "회원가입", exact: true }).click();
  await expect(sheet).toHaveCount(0);

  // 새로고침해도 이미 동의한 약관을 다시 묻지 않는다(signupToken과 함께 세션 스토리지에 남아 있다).
  await page.reload();
  await expect(page.getByLabel("이름", { exact: true })).toHaveValue("소셜 사용자");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.getByLabel("닉네임", { exact: true }).fill("펀딧러");
  await page.getByLabel("휴대폰 번호", { exact: true }).fill("01012345678");
  await Promise.all([
    page.waitForURL(/\/auth\/signup\/complete$/),
    page.getByRole("button", { name: "가입하기" }).click(),
  ]);
  expect(requests[0]).toMatchObject({ agreedTerms: expect.arrayContaining(ALL_REQUIRED_TERMS) });
});

test("약관 시트를 동의 없이 닫으면 가입 정보를 지우고 시작한 화면으로 돌아간다", async ({
  page,
}) => {
  await openCallback(page, "mock-signup", { entry: "login", provider: "GOOGLE" });
  await expect(page).toHaveURL(/\/auth\/signup\/social$/);

  await page.getByRole("button", { name: "약관 동의 닫기" }).click();
  await expect(page).toHaveURL(/\/auth\/login/);
  // signupToken이 남아 있으면 다시 열었을 때 폼이 살아난다. 남기지 않는다.
  await page.goto("/auth/signup/social");
  await expect(page.getByText("가입 정보를", { exact: false })).toBeVisible();
});

test("가입 정보 없이 직접 열면 처음부터 다시 시도하도록 안내한다", async ({ page }) => {
  await page.goto("/auth/signup/social");

  await expect(page.getByText(/소셜 인증 정보가 만료됐거나 이미 사용됐어요/)).toBeVisible();
  await page.getByRole("button", { name: "회원가입으로 가기" }).click();
  await expect(page).toHaveURL(/\/auth\/signup$/);
});

test("가입 요청이 실패하면 원인을 단정하지 않고 처음부터 다시 시도하게 한다", async ({ page }) => {
  await openCallback(page, "mock-signup-broken", {
    agreedTerms: ALL_REQUIRED_TERMS,
    entry: "signup",
    provider: "GOOGLE",
  });
  await page.getByLabel("닉네임", { exact: true }).fill("펀딧러");
  await page.getByLabel("휴대폰 번호", { exact: true }).fill("01012345678");
  await page.getByRole("button", { name: "가입하기" }).click();

  await expect(page.getByText(/가입을 완료하지 못했어요/)).toBeVisible();
  // 새로고침해도 같은 토큰으로 폼이 되살아나지 않는다(제출 직전에 지웠다).
  await page.reload();
  await expect(page.getByText(/소셜 인증 정보가 만료됐거나 이미 사용됐어요/)).toBeVisible();
});

test("토큰이 만료됐으면 소셜 인증부터 다시 시작하게 한다", async ({ page }) => {
  await openCallback(page, "mock-signup-expired", {
    agreedTerms: ALL_REQUIRED_TERMS,
    entry: "signup",
    provider: "GOOGLE",
  });
  await page.getByLabel("닉네임", { exact: true }).fill("펀딧러");
  await page.getByLabel("휴대폰 번호", { exact: true }).fill("01012345678");
  await page.getByRole("button", { name: "가입하기" }).click();

  await expect(page.getByText(/소셜 인증 정보가 만료됐어요/)).toBeVisible();
  // 다시 시도는 새 state로 인가를 처음부터 시작하고, 개발 모드 목업에서는 콜백으로 바로 돌아온다.
  await Promise.all([
    page.waitForURL((url) => url.pathname === "/"),
    page.getByRole("button", { name: "다시 시도" }).click(),
  ]);
});

test("이메일이 이미 가입돼 있으면 이메일 로그인을 안내한다", async ({ page }) => {
  await openCallback(page, "mock-signup-conflict", {
    agreedTerms: ALL_REQUIRED_TERMS,
    entry: "signup",
    provider: "GOOGLE",
  });
  await page.getByLabel("닉네임", { exact: true }).fill("펀딧러");
  await page.getByLabel("휴대폰 번호", { exact: true }).fill("01012345678");
  await page.getByRole("button", { name: "가입하기" }).click();

  await expect(page.getByText(/이미 이 이메일로 가입된 계정이 있어요/)).toBeVisible();
  await page.getByRole("button", { name: "이메일로 로그인" }).click();
  await expect(page).toHaveURL(/\/auth\/login$/);
});
