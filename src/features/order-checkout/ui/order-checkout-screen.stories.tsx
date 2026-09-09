import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { OrderCheckoutScreen } from "./order-checkout-screen";

const meta = {
  title: "Features/Order Checkout",
  component: OrderCheckoutScreen,
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
  },
} satisfies Meta<typeof OrderCheckoutScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 진입 기본값 — 저장된 배송지가 있는 상태(FL_B_PY_ORD). */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole("heading", { name: "홍길동", level: 2 })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "배송지 변경" })).toBeVisible();

    // 최종 결제 금액과 CTA 금액이 목업 내역(694,000원)으로 일치한다.
    await expect(canvas.getByText("최종 결제 금액").nextElementSibling).toHaveTextContent(
      "694,000원",
    );
    await expect(canvas.getByRole("button", { name: "694,000원 결제하기" })).toBeDisabled();

    // 전체 동의 → 개별 필수/선택 약관이 모두 체크되고, 해제하면 모두 풀린다.
    const agreeAll = canvas.getByRole("checkbox", { name: "전체 동의합니다" });
    await userEvent.click(agreeAll);
    for (const box of canvas.getAllByRole("checkbox")) {
      await expect(box).toBeChecked();
    }
    await userEvent.click(agreeAll);
    await expect(
      canvas.getByRole("checkbox", { name: "구매조건 및 결제대행 서비스 동의 (필수)" }),
    ).not.toBeChecked();
  },
};

/** 저장된 배송지가 없는 상태 — "신규 배송지 추가" 버튼 노출. */
export const EmptyAddress: Story = {
  args: { shippingState: "empty" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "+ 신규 배송지 추가" })).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "배송지 변경" })).toBeNull();
  },
};

/** 배송지 미입력 상태로 결제를 시도한 뒤 — 배송지 영역이 경고로 강조된다. */
export const WarningAddress: Story = {
  args: { shippingState: "warning" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("alert")).toHaveTextContent("배송지를 입력해주세요");
  },
};
