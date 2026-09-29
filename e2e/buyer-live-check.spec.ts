import { test, expect } from "@playwright/test";
import { FIXTURE_PROJECT_ID } from "../src/mocks/fixtures";

/* UCS 소비자 24: 방송 종료 뒤 프로젝트 상세의 LIVE 체크 탭에서 Q&A를 확인한다. */
test("LIVE 체크 탭에서 질문·답변을 보고, 질문 요약 전 답변은 답변만 보인다", async ({ page }) => {
  await page.goto(`/projects/${FIXTURE_PROJECT_ID}`);
  await page.getByRole("link", { name: /^LIVE 체크/ }).click();

  await expect(page).toHaveURL(/tab=live-proof/);
  await expect(page.getByRole("heading", { name: "배터리는 얼마나 오래 가나요?" })).toBeVisible();
  await expect(page.getByText("12건")).toBeVisible();
  await expect(page.getByText("완충하면 최대 8시간 사용할 수 있어요.")).toBeVisible();
  // 질문 요약을 받기 전에 등록된 항목: 질문 문구·건수 없이 답변만 있다.
  await expect(page.getByText("생활 방수(IPX4) 등급입니다.")).toBeVisible();
  await expect(page.getByText("0건")).not.toBeVisible();
});
