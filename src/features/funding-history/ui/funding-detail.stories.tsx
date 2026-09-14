import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { FundingDetail } from "./funding-detail";

const meta = {
  title: "Features/Funding History/Detail",
  component: FundingDetail,
  args: { fundingId: "in_progress" },
  parameters: { layout: "fullscreen", nextjs: { appDirectory: true } },
  decorators: [
    (Story) => (
      <div className="bg-layer-bg py-6">
        <Story />
      </div>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof FundingDetail>;
export default meta;

type Story = StoryObj<typeof meta>;

/** 진행 중 펀딩 — 펀딩 취소 + 제작·배송 현황 버튼을 모두 보여준다. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "펀딩 상세 내역" })).toBeVisible();
    await expect(canvas.getByText("FD000000-000000")).toBeVisible();
    await expect(canvas.getByRole("link", { name: "펀딩 취소" })).toHaveAttribute(
      "href",
      "/my/fundings/in_progress/cancel",
    );
    await expect(canvas.getByRole("link", { name: "제작·배송 현황" })).toHaveAttribute(
      "href",
      "/my/fundings/in_progress/fulfillment",
    );
  },
};

/** 배송 중 펀딩 — 취소 버튼 없이 제작·배송 현황만 보여준다. */
export const Shipping: Story = {
  args: { fundingId: "shipping" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole("link", { name: "펀딩 취소" })).toBeNull();
    await expect(canvas.getByRole("link", { name: "제작·배송 현황" })).toBeVisible();
  },
};

/** 배송 완료 펀딩 — 펀딩 환불 + 제작·배송 현황 버튼을 보여준다. */
export const Delivered: Story = {
  args: { fundingId: "delivered" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("link", { name: "펀딩 환불" })).toHaveAttribute(
      "href",
      "/my/fundings/delivered/refund/new?type=cancel",
    );
  },
};
