import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { demoCoupons } from "../model/checkout-demo";
import { CouponSheet } from "./coupon-sheet";

const meta = {
  title: "Features/Order Checkout/Coupon Sheet",
  component: CouponSheet,
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
  },
  args: {
    open: true,
    onClose: fn(),
    onApply: fn(),
    coupons: demoCoupons(),
    orderAmount: 699_000,
    selectedId: "flat-10000",
  },
} satisfies Meta<typeof CouponSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 목록 — 기본 선택은 "10,000원 할인 쿠폰", "100,000원 할인 쿠폰"은 최소 주문액 미달로 비활성. */
export const List: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole("heading", { name: "쿠폰 선택" })).toBeVisible();
    await expect(canvas.getByRole("radio", { name: "10,000원 할인 쿠폰" })).toBeChecked();
    await expect(canvas.getByRole("radio", { name: "100,000원 할인 쿠폰" })).toBeDisabled();

    // 다른 쿠폰으로 바꾸고 저장 → 그 id 가 onApply 로 넘어간다.
    await userEvent.click(canvas.getByRole("radio", { name: "3,000원 할인 쿠폰" }));
    await userEvent.click(canvas.getByRole("button", { name: "저장" }));
    await expect(args.onApply).toHaveBeenCalledWith("flat-3000");
  },
};

/** "사용하지 않음" 선택 → onApply(null). */
export const SelectNone: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("radio", { name: "사용하지 않음" }));
    await userEvent.click(canvas.getByRole("button", { name: "저장" }));
    await expect(args.onApply).toHaveBeenCalledWith(null);
  },
};

/** 빈 상태 — 보유 쿠폰이 없을 때. */
export const Empty: Story = {
  args: { coupons: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("사용가능한 쿠폰이 없습니다")).toBeVisible();
    await expect(canvas.queryByRole("radio")).toBeNull();
  },
};
