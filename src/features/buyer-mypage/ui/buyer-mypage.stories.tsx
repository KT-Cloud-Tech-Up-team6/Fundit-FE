import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { BuyerMyPage } from "./buyer-mypage";

const meta = {
  title: "Features/BuyerMyPage",
  component: BuyerMyPage,
  parameters: { layout: "fullscreen", nextjs: { appDirectory: true } },
} satisfies Meta<typeof BuyerMyPage>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("link", { name: "관심 목록" })).toHaveAttribute(
      "href",
      "/my/wishlist",
    );
    await expect(canvas.getByRole("link", { name: "취소/환불/교환 내역" })).toHaveAttribute(
      "href",
      "/my/refunds",
    );
    await expect(canvas.getByRole("link", { name: "판매자 모드로 이동" })).toHaveAttribute(
      "href",
      "/seller/projects",
    );
    await expect(canvas.getByRole("link", { name: "마이" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  },
};
