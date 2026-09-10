import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { demoBuyerFulfillmentState } from "../model/fulfillment-demo";
import type { BuyerFulfillmentState } from "../model/fulfillment-demo";
import { BuyerFulfillmentSummary } from "./buyer-fulfillment-summary";

/* 목업 기록 날짜는 오늘 기준 상대값이라, 스토리는 기준일을 고정해 상태를 만든다. */
const today = "2026-08-28";

/** 목업 기본 상태를 조금씩 바꿔 상태별 스토리를 만든다. */
function stateWith(change: (state: BuyerFulfillmentState) => void): BuyerFulfillmentState {
  const state = demoBuyerFulfillmentState(today);
  change(state);
  return state;
}

const meta = {
  title: "Features/Fulfillment Tracking/Buyer Summary",
  component: BuyerFulfillmentSummary,
  args: { fundingId: "demo-funding" },
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="bg-layer-bg py-6">
        <Story />
      </div>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof BuyerFulfillmentSummary>;
export default meta;

type Story = StoryObj<typeof meta>;

/** 진입 기본값 — `생산`이 진행 중이고 최신 기록 1건이 펼쳐져 있다. */
export const Default: Story = {
  args: { today },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "제작·배송 현황" })).toBeVisible();

    const currentStep = canvas.getByRole("listitem", { name: "생산 단계, 진행 중" });
    await expect(currentStep).toHaveAttribute("aria-current", "step");

    await expect(canvas.getByRole("link", { name: "세부 진행 기록 더보기" })).toHaveAttribute(
      "href",
      "/my/fundings/demo-funding/fulfillment/history",
    );
  },
};

/** 지연 기록이 타임라인에 `지연` 표기로 보인다. */
export const Delayed: Story = {
  args: { today },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("지연")).toBeVisible();
  },
};

/** 마지막 기록 후 오래 지난 상태 — 현재 단계 타임라인 위에 정체 경고가 뜬다. */
export const Stale: Story = {
  args: { today: "2026-09-20", initialState: demoBuyerFulfillmentState("2026-08-20") },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/마지막 업데이트 후 \d+일이 지났어요\./)).toBeVisible();
  },
};

/** 현재 단계에 기록이 아직 없는 상태 — 빈 타임라인 문구가 보인다. */
export const EmptyStage: Story = {
  args: {
    today,
    initialState: stateWith((state) => {
      state.stages.production.records = [];
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("아직 등록된 기록이 없어요.")).toBeVisible();
  },
};

/** 접힌 기록의 chevron을 누르면 본문 전체와 이미지가 펼쳐진다. */
export const ExpandFoldedRecord: Story = {
  args: { today },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getAllByRole("button", { name: /기록 펼치기$/ })[0];
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(toggle);
    await expect(canvas.getAllByRole("button", { name: /기록 접기$/ })[0]).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  },
};
