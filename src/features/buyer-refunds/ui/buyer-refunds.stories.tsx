import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { BuyerRefunds } from "./buyer-refunds";

const meta = {
  title: "Features/BuyerRefunds",
  component: BuyerRefunds,
  parameters: { layout: "fullscreen", nextjs: { appDirectory: true } },
} satisfies Meta<typeof BuyerRefunds>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Empty: Story = { args: { entries: [] } };

export const FilterByType: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("총 4개")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "유형 필터" }));
    await userEvent.click(canvas.getByRole("option", { name: "환불" }));
    await expect(canvas.getByText("총 1개")).toBeVisible();
    await expect(canvas.queryByText("FD20260828-000162")).not.toBeInTheDocument();
  },
};

export const FilterInProgressOnly: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("radio", { name: "진행 중만 보기" }));
    await expect(canvas.getByText("총 1개")).toBeVisible();
    await expect(canvas.getByText("FD20260901-000123")).toBeVisible();
  },
};

export const ExpandHistory: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const complete = canvas.getByText("FD20260820-000089").closest("details")!;
    await expect(complete).toHaveAttribute("open");
    await userEvent.click(within(complete).getByText("FD20260820-000089"));
    await expect(complete).not.toHaveAttribute("open");
    const pending = canvas.getByText("FD20260901-000123").closest("details")!;
    await userEvent.click(within(pending).getByText("FD20260901-000123"));
    await expect(pending).toHaveAttribute("open");
    await expect(within(pending).queryByText("실 환불 금액")).not.toBeInTheDocument();
    const exchange = canvas.getByText("FD20260828-000162").closest("details")!;
    await userEvent.click(within(exchange).getByText("FD20260828-000162"));
    await expect(within(exchange).getByText("상품 불량")).toBeVisible();
    await expect(within(exchange).queryByText("실 환불 금액")).not.toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: "저장" })).not.toBeInTheDocument();
  },
};
