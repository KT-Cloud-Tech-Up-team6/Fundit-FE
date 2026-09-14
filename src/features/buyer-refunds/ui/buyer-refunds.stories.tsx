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
export const ExpandHistory: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const complete = canvas.getByText("FD260909-000002").closest("details")!;
    await expect(complete).toHaveAttribute("open");
    await userEvent.click(within(complete).getByText("FD260909-000002"));
    await expect(complete).not.toHaveAttribute("open");
    const pending = canvas.getByText("FD260909-000001").closest("details")!;
    await userEvent.click(within(pending).getByText("FD260909-000001"));
    await expect(pending).toHaveAttribute("open");
    await expect(within(pending).queryByText("실 환불 금액")).not.toBeInTheDocument();
    const exchange = canvas.getByText("FD260909-000004").closest("details")!;
    await userEvent.click(within(exchange).getByText("FD260909-000004"));
    await expect(within(exchange).getByText("상품 불량")).toBeVisible();
    await expect(within(exchange).queryByText("실 환불 금액")).not.toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: "저장" })).not.toBeInTheDocument();
  },
};
