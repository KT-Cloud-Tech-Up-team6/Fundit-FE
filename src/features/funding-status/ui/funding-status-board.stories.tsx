import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { demoFundingSummary, demoRewardRows } from "../model/funding-demo";
import { FundingStatusBoard } from "./funding-status-board";

const meta = {
  title: "Features/Funding Status",
  component: FundingStatusBoard,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="bg-layer-bg p-6">
        <Story />
      </div>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof FundingStatusBoard>;
export default meta;

type Story = StoryObj<typeof meta>;

/** 진입 기본값 — 달성률 128%로 목표를 넘긴 상태(Figma 화면). */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "펀딩 관리", level: 1 })).toBeVisible();
    // 128%여도 막대는 100으로 클램프되고 수치 라벨만 초과분을 보여준다.
    await expect(canvas.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
    await expect(canvas.getByText("128")).toBeVisible();
    await expect(canvas.getAllByRole("row")).toHaveLength(demoRewardRows().length + 1);
  },
};

/** 목표를 아직 못 채운 상태 — 막대와 수치가 같은 값을 가리킨다. */
export const InProgress: Story = {
  args: {
    summary: { ...demoFundingSummary(), raisedAmount: 3_200_000, dday: "D-12" },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "64");
    await expect(canvas.getByText("D-12")).toBeVisible();
  },
};

/** 펀딩이 끝난 상태 — 남은 기간 배지 문구만 바뀐다. */
export const Ended: Story = {
  args: {
    summary: { ...demoFundingSummary(), dday: "종료" },
  },
};
