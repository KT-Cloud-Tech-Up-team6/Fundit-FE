import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { SavedAddressSheet } from "./saved-address-sheet";

const meta = {
  title: "Features/Order Checkout/Saved Address Sheet",
  component: SavedAddressSheet,
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
    viewport: {
      options: {
        figma390: { name: "Figma 390 × 844", styles: { width: "390px", height: "844px" } },
        desktop: { name: "Desktop 1440 × 900", styles: { width: "1440px", height: "900px" } },
      },
    },
  },
  args: {
    open: true,
    selectedId: 1,
    addresses: [
      {
        id: 1,
        recipientName: "큐에이",
        phoneNumber: "01000000000",
        zipcode: "06236",
        addressLine1: "서울 강남구 테헤란로 1",
        addressLine2: "101호",
        isDefault: true,
      },
      {
        id: 2,
        recipientName: "회사",
        phoneNumber: "01011112222",
        zipcode: "04524",
        addressLine1: "서울 중구 세종대로 110",
        addressLine2: "",
        isDefault: false,
      },
    ],
    onSelect: fn(),
    onAdd: fn(),
    onClose: fn(),
  },
} satisfies Meta<typeof SavedAddressSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 지금 쓰는 배송지를 표시하고, 다른 배송지를 누르면 바로 넘긴다. 신규 배송지는 입력 시트로 넘긴다. */
const play: Story["play"] = async ({ canvasElement, args }) => {
  const canvas = within(canvasElement);
  await canvas.findByRole("dialog");
  await expect(canvas.getByRole("heading", { name: "배송지 선택" })).toBeVisible();
  const current = canvas.getByRole("button", {
    name: "큐에이 · 기본 배송지 · 서울 강남구 테헤란로 1 101호",
  });
  await expect(current).toHaveAttribute("aria-pressed", "true");
  const other = canvas.getByRole("button", { name: "회사 · 서울 중구 세종대로 110" });
  await expect(other).toHaveAttribute("aria-pressed", "false");
  await userEvent.click(other);
  await expect(args.onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }));
  await userEvent.click(canvas.getByRole("button", { name: "신규 배송지" }));
  await expect(args.onAdd).toHaveBeenCalledTimes(1);
};

export const Mobile: Story = { globals: { viewport: { value: "figma390" } }, play };

export const Desktop: Story = { globals: { viewport: { value: "desktop" } }, play };
