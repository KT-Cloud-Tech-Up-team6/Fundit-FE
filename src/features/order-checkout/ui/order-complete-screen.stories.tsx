import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import { OrderCompleteScreen } from "./order-complete-screen";

const meta = {
  title: "Features/Order Checkout/Order Complete Screen",
  component: OrderCompleteScreen,
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
  },
} satisfies Meta<typeof OrderCompleteScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 진입 기본 — 카운트다운 후 펀딩내역으로 자동 이동. */
export const Default: Story = {
  args: { redirectSeconds: 10 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole("heading", { name: "펀딩 참여가 완료됐어요!" })).toBeVisible();
    await expect(canvas.getByText("예상 발송일 2026.11.02")).toBeVisible();

    // 영수증 행
    await expect(canvas.getByText("주문번호").nextElementSibling).toHaveTextContent(
      "FD20261108-000123",
    );
    await expect(canvas.getByText("결제금액").nextElementSibling).toHaveTextContent("39,000원");
    await expect(canvas.getByText("주문자").nextElementSibling).toHaveTextContent(
      "홍길동 · 010-1111-2222",
    );

    await expect(canvas.getByText(/초 후 펀딩내역 화면으로 자동 이동합니다/)).toBeVisible();
    // 공유 연동 전까지 비활성
    await expect(canvas.getByRole("button", { name: "프로젝트 공유하기" })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: "펀딩내역 보기" })).toBeEnabled();
  },
};

/** 자동 이동 없음 — 카운트다운 안내가 숨겨진다(스토리 검증용). */
export const NoAutoRedirect: Story = {
  args: { redirectSeconds: 0 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByText(/자동 이동합니다/)).toBeNull();
  },
};
