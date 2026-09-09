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

    // 적립금 0원일 때 최종 결제 금액 = 699,000 − 쿠폰 4,000 = 695,000원, CTA 금액도 일치.
    const finalAmount = () => canvas.getByText("최종 결제 금액").nextElementSibling;
    await expect(finalAmount()).toHaveTextContent("695,000원");
    await expect(canvas.getByRole("button", { name: "695,000원 결제하기" })).toBeEnabled();

    // 적립금 입력 → 최종 결제 금액과 CTA가 실시간으로 줄어든다.
    await userEvent.type(canvas.getByLabelText("사용할 적립금"), "3000");
    await expect(finalAmount()).toHaveTextContent("692,000원");
    await expect(canvas.getByRole("button", { name: "692,000원 결제하기" })).toBeVisible();

    // 보유 잔액(5,000)을 넘겨 입력하면 잔액까지만 반영된다.
    await userEvent.clear(canvas.getByLabelText("사용할 적립금"));
    await userEvent.type(canvas.getByLabelText("사용할 적립금"), "6000");
    await expect(canvas.getByLabelText("사용할 적립금")).toHaveValue("5000");
    await expect(finalAmount()).toHaveTextContent("690,000원");

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
  args: { hasSavedAddress: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "신규 배송지 추가" })).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "배송지 변경" })).toBeNull();
    // 아직 결제를 시도하지 않았으므로 경고는 없다.
    await expect(canvas.queryByRole("alert")).toBeNull();
  },
};

/** interaction_spec: 배송지 미입력 상태로 [결제하기]를 누르면 배송지 영역이 Warning으로 강조된다. */
export const PaymentAttemptWithoutAddress: Story = {
  args: { hasSavedAddress: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /결제하기$/ }));
    await expect(canvas.getByRole("alert")).toHaveTextContent("배송지를 입력해주세요");
  },
};
