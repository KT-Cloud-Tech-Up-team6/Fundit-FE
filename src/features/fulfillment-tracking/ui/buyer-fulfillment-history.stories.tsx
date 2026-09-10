import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { demoBuyerFulfillmentState } from "../model/fulfillment-demo";
import { BuyerFulfillmentHistory } from "./buyer-fulfillment-history";

/* 목업 기록 날짜는 오늘 기준 상대값이라, 스토리는 기준일을 고정한다. */
const today = "2026-08-28";

const meta = {
  title: "Features/Fulfillment Tracking/Buyer History",
  component: BuyerFulfillmentHistory,
  args: { fundingId: "demo-funding", today },
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="bg-layer-bg py-6">
        <Story />
      </div>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof BuyerFulfillmentHistory>;
export default meta;

type Story = StoryObj<typeof meta>;

/** 진입 기본값 — 현재 단계인 `생산`만 펼쳐져 타임라인이 보인다. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("예상 발송일", { exact: false })).toBeVisible();

    const production = canvas.getByRole("button", { name: /생산/ });
    await expect(production).toHaveAttribute("aria-expanded", "true");
    await expect(canvas.getByText(/생산 준비를 마치고 원자재 검수/)).toBeVisible();

    const inspection = canvas.getByRole("button", { name: /검수/ });
    await expect(inspection).toHaveAttribute("aria-expanded", "false");
  },
};

/** 아직 시작하지 않은 단계를 펼치면 `예상 시작일` 한 줄만 보이고 기록은 없다. */
export const FutureStageExpanded: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /검수/ }));
    await expect(canvas.getByText(/^예상 시작일/)).toBeVisible();
  },
};

/** 완료된 단계를 펼치면 기간과 타임라인이 보인다. */
export const DoneStageExpanded: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /제작 착수/ }));
    await expect(canvas.getByText(/샘플 검토를 마치고 초도 물량 발주/)).toBeVisible();
  },
};

/** 미래 단계뿐인 극단 케이스 — 모든 아코디언이 접혀 있고 첫 단계만 열린다. */
export const NotStarted: Story = {
  args: {
    initialState: {
      ...demoBuyerFulfillmentState(today),
      stages: {
        ...demoBuyerFulfillmentState(today).stages,
        prep: { status: "active", records: [], startDate: today },
        production: { status: "todo", records: [], startDate: today },
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const prep = canvas.getByRole("button", { name: /제작 착수/ });
    await expect(prep).toHaveAttribute("aria-expanded", "true");
    await expect(canvas.getByText("아직 등록된 기록이 없어요.")).toBeVisible();
  },
};
