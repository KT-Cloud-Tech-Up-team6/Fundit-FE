import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { refundSummariesDemo } from "../model/refunds-demo";
import { toRefundEntry } from "../model/refund-history";
import { BuyerRefunds } from "./buyer-refunds";

const entries = refundSummariesDemo.map(toRefundEntry);
const cancelled = "[진짜싹싹] 35,000Pa 초강력 흡입, 가볍게 끝내는 무선청소기";
const delayed = "키친모먼트 스테인리스 전기주전자";
const rejected = "센트모먼트 바디미스트";

const meta = {
  title: "Features/BuyerRefunds",
  component: BuyerRefunds,
  args: { entries },
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
    viewport: {
      options: {
        figma390: { name: "Figma 390 × 844", styles: { width: "390px", height: "844px" } },
        desktop: { name: "Desktop 1280 × 800", styles: { width: "1280px", height: "800px" } },
      },
    },
  },
  globals: { viewport: { value: "figma390" } },
} satisfies Meta<typeof BuyerRefunds>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Empty: Story = { args: { entries: [] } };
export const Desktop: Story = { globals: { viewport: { value: "desktop" } } };

export const FilterByType: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("총 5개")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "유형 필터" }));
    await userEvent.click(canvas.getByRole("option", { name: "환불" }));
    await expect(canvas.getByText("총 3개")).toBeVisible();
    await expect(canvas.queryByText(delayed)).not.toBeInTheDocument();
  },
};

/** 목업에는 교환 건이 없어 빈 목록 문구가 나온다. */
export const FilterExchange: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "유형 필터" }));
    await userEvent.click(canvas.getByRole("option", { name: "교환" }));
    await expect(canvas.getByText("취소/환불/교환 내역이 없습니다.")).toBeVisible();
  },
};

export const FilterInProgressOnly: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("radio", { name: "진행 중만 보기" }));
    await expect(canvas.getByText("총 2개")).toBeVisible();
    await expect(canvas.getByText(delayed)).toBeVisible();
    await expect(canvas.queryByText(cancelled)).not.toBeInTheDocument();
  },
};

export const ExpandHistory: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const complete = canvas.getByText(cancelled).closest("details")!;
    await expect(complete).toHaveAttribute("open");
    await userEvent.click(canvas.getByText(cancelled));
    await expect(complete).not.toHaveAttribute("open");

    const pending = canvas.getByText(delayed).closest("details")!;
    await userEvent.click(canvas.getByText(delayed));
    await expect(pending).toHaveAttribute("open");
    await expect(within(pending).getByText("발송 지연")).toBeVisible();
    await expect(within(pending).queryByText("실 환불 금액")).not.toBeInTheDocument();

    const denied = canvas.getByText(rejected).closest("details")!;
    await userEvent.click(canvas.getByText(rejected));
    await expect(within(denied).getByText("제품 하자가 확인되지 않았습니다")).toBeVisible();
    await expect(within(denied).queryByText("실 환불 금액")).not.toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: "저장" })).not.toBeInTheDocument();
  },
};
