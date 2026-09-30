import { test, expect, type Page } from "@playwright/test";

/* UCS 소비자 2~12: 회원가입 → 약관 동의 → 본인인증 → 회원 정보 입력 → 가입 완료.
   PortOne은 개발 서버 + MSW 조합에서 인증창 없이 성공으로 돌아가고(portone-identity-adapter.ts),
   나머지는 auth-handlers.ts가 응답한다. 주소 검색(다음 우편번호)은 외부 스크립트라 "다음에 설정할게요"로 건너뛴다. */
async function agreeAndVerify(page: Page, phoneNumber = "01011112222") {
  await page.goto("/auth/signup");
  await page.getByRole("button", { name: "일반 회원가입" }).click();
  // 약관을 불러오는 동안 전체 동의는 비활성이라 켜질 때까지 기다린다.
  const agreeAll = page.getByRole("checkbox", { name: /펀딧 이용 약관 동의 \(전체\)/ });
  await expect(agreeAll).toBeEnabled();
  await agreeAll.check({ force: true });
  await page.getByRole("button", { name: "회원가입", exact: true }).click();

  await expect(page).toHaveURL(/\/auth\/signup\/verify/);
  await page.getByLabel("이름").fill("홍길동");
  await page.getByLabel("생년월일").fill("1990-01-01");
  await page.getByLabel("휴대폰 번호").fill(phoneNumber);
  await page.getByRole("button", { name: "본인인증하기" }).click();

  await expect(page.getByText("본인 확인이 완료되었습니다")).toBeVisible();
  await page.getByRole("button", { name: "다음", exact: true }).click();
  await expect(page).toHaveURL(/\/auth\/signup\/profile/);
}

test("이메일·비밀번호를 입력해 회원가입을 완료한다", async ({ page }) => {
  await agreeAndVerify(page);

  await page.getByLabel("이메일 아이디").fill("newbie");
  await page.getByLabel("닉네임").fill("신규회원");
  await page.getByRole("button", { name: "다음", exact: true }).click();

  await page.getByLabel("비밀번호", { exact: true }).fill("Passw0rd!1");
  await page.getByLabel("비밀번호 확인").fill("Passw0rd!1");
  await page.getByRole("button", { name: "다음", exact: true }).click();

  await page.getByRole("button", { name: "다음에 설정할게요" }).click();

  await expect(page).toHaveURL(/\/auth\/signup\/complete/);
  await expect(page.getByText("회원가입이 완료되었습니다")).toBeVisible();
  await Promise.all([
    page.waitForURL((url) => url.pathname === "/"),
    page.getByRole("button", { name: "펀딩 시작하기" }).click(),
  ]);
});

test("이미 가입된 이메일이면 안내하고 다음 단계로 넘어가지 않는다", async ({ page }) => {
  await agreeAndVerify(page);

  await page.getByLabel("이메일 아이디").fill("taken");
  await page.getByLabel("닉네임").fill("중복회원");
  await page.getByRole("button", { name: "다음", exact: true }).click();

  await expect(page.getByText("이미 가입된 주소입니다.")).toBeVisible();
  await expect(page.getByLabel("비밀번호", { exact: true })).not.toBeVisible();
});

test("예약어 닉네임이면 닉네임 단계로 돌아가 안내하고, 고치면 본인인증 없이 가입을 마친다", async ({
  page,
}) => {
  await agreeAndVerify(page);

  await page.getByLabel("이메일 아이디").fill("reserved");
  // 목업은 BE처럼 공백을 빼고 예약어와 비교한다.
  await page.getByLabel("닉네임").fill("AI 매니저");
  await page.getByRole("button", { name: "다음", exact: true }).click();
  await page.getByLabel("비밀번호", { exact: true }).fill("Passw0rd!1");
  await page.getByLabel("비밀번호 확인").fill("Passw0rd!1");
  await page.getByRole("button", { name: "다음", exact: true }).click();
  await page.getByRole("button", { name: "다음에 설정할게요" }).click();

  const nickname = page.getByLabel("닉네임");
  await expect(page.getByText("사용할 수 없는 닉네임입니다.")).toBeVisible();
  await expect(nickname).toHaveValue("AI 매니저");
  // 같은 닉네임으로는 다음 단계로 넘어가지 않는다.
  await page.getByRole("button", { name: "다음", exact: true }).click();
  await expect(page.getByLabel("비밀번호", { exact: true })).not.toBeVisible();

  await nickname.fill("응원왕");
  await expect(page.getByText("사용할 수 없는 닉네임입니다.")).toHaveCount(0);
  await page.getByRole("button", { name: "다음", exact: true }).click();
  // 앞에서 입력한 비밀번호가 남아 있어 그대로 넘어간다.
  await expect(page.getByLabel("비밀번호", { exact: true })).toHaveValue("Passw0rd!1");
  await page.getByRole("button", { name: "다음", exact: true }).click();
  await page.getByRole("button", { name: "다음에 설정할게요" }).click();

  await expect(page).toHaveURL(/\/auth\/signup\/complete/);
});

test("본인인증 정보로 이미 만들어진 계정이 있으면 로그인·이메일 찾기를 안내한다", async ({
  page,
}) => {
  await agreeAndVerify(page, "01000000000");

  await page.getByLabel("이메일 아이디").fill("dup");
  await page.getByLabel("닉네임").fill("중복계정");
  await page.getByRole("button", { name: "다음", exact: true }).click();
  await page.getByLabel("비밀번호", { exact: true }).fill("Passw0rd!1");
  await page.getByLabel("비밀번호 확인").fill("Passw0rd!1");
  await page.getByRole("button", { name: "다음", exact: true }).click();
  await page.getByRole("button", { name: "다음에 설정할게요" }).click();

  await expect(page.getByRole("heading", { name: "이미 가입된 계정이 있습니다" })).toBeVisible();
});
