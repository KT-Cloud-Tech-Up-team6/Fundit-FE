import { test, expect } from "@playwright/test";
import { loginAsFixtureUser } from "./support/login";
import { FIXTURE_SELLER_PROJECT_ID } from "../src/mocks/fixtures";

/* UCS 판매자 54~58: 프로젝트 관리 → 제작·배송 탭에서 단계 진행 기록·일정 변경(지연사유)·단계 완료.
   같은 탭 안에서만 상태가 이어지므로(MSW 인메모리) 로그인 뒤 한 번 진입해 끝까지 진행한다. */
test("판매자가 진행 기록을 등록하고 지연사유로 일정을 바꾼 뒤 다음 단계로 넘어간다", async ({
  page,
}) => {
  await loginAsFixtureUser(page);
  await page.goto(`/seller/projects/${FIXTURE_SELLER_PROJECT_ID}?tab=fulfillment`);
  await expect(page.getByText("현재 단계. 제작 착수")).toBeVisible();

  await page.getByLabel("진행 내용").fill("금형 제작을 시작했습니다.");
  await page.getByRole("button", { name: "기록 등록" }).click();
  await expect(page.getByRole("status").filter({ hasText: "저장했습니다." })).toBeVisible();
  await expect(page.getByText("금형 제작을 시작했습니다.")).toBeVisible();

  // 지연사유: 기타를 고르면 상세 사유가 필수다(빈 사유로는 등록할 수 없다).
  await page.getByLabel("변경 사유").selectOption({ label: "기타" });
  await page.getByLabel("변경 일정 (한국 시간)").fill("2030-01-15");
  const register = page.getByRole("button", { name: "일정 변경 등록" });
  await expect(register).toBeDisabled();
  await page.getByLabel("상세 사유").fill("부품 수급 지연");
  await expect(register).toBeEnabled();
  await register.click();
  const history = page.getByRole("heading", { name: "일정 변경 이력" }).locator("..");
  await expect(history).toContainText("제작 착수 · 기타 · 2030-01-15 부품 수급 지연");

  await page.getByRole("button", { name: "제작 착수 완료하고 생산 시작" }).click();
  await expect(page.getByText("현재 단계. 생산")).toBeVisible();
});

/* UCS 판매자 59~62: 발송 정보에서 주문별 택배사·운송장을 입력하고 발송 처리한다. */
test("판매자가 택배사·운송장을 입력해 주문을 발송 처리한다", async ({ page }) => {
  await loginAsFixtureUser(page);
  await page.goto(`/seller/projects/${FIXTURE_SELLER_PROJECT_ID}/shipping`);

  await expect(
    page.getByRole("tab", { name: /발송 대기/ }).or(page.getByRole("link", { name: /발송 대기/ })),
  ).toContainText("2");
  const row = page.getByRole("row", { name: /김서포터/ });
  await expect(row.getByRole("button", { name: "발송 처리" })).toBeDisabled();

  await row.getByRole("combobox", { name: /택배사/ }).selectOption("CJ대한통운");
  await row.getByRole("textbox", { name: /운송장 번호/ }).fill("123456789012");
  await row.getByRole("button", { name: "발송 처리" }).click();

  await expect(page.getByText("1건을 발송 처리했어요.")).toBeVisible();
  await expect(row.getByRole("button", { name: "발송 완료" })).toBeDisabled();
  await expect(
    page.getByRole("row", { name: /이서포터/ }).getByRole("button", { name: "발송 처리" }),
  ).toBeDisabled();
});
