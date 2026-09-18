import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { demoBuyerFulfillmentState } from "../model/fulfillment-demo";
import { BuyerFulfillmentHistory } from "./buyer-fulfillment-history";

/* 단계별 테스트의 날짜를 Figma 기준일로 고정한다. */
const today = "2026-09-28";

/** 두 레이아웃이 DOM에 함께 있어 텍스트 쿼리는 모바일 트리로 좁힌다(role 쿼리는 숨겨진 쪽을 무시). */
const mobile = (root: HTMLElement) =>
  within(root.querySelector<HTMLElement>('[data-layout="mobile"]')!);

const meta = {
  title: "Features/Fulfillment Tracking/Buyer History",
  component: BuyerFulfillmentHistory,
  args: { fundingId: "demo-funding" },
  parameters: {
    layout: "fullscreen",
    // 모바일 트리가 기본 — 데스크톱 트리는 min-[1200px]에서만 보인다.
    viewport: {
      defaultViewport: "figma390",
      options: {
        figma390: { name: "Figma 390 × 844", styles: { width: "390px", height: "844px" } },
        desktop: { name: "Desktop 1280 × 800", styles: { width: "1280px", height: "800px" } },
      },
    },
  },
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
    await expect(mobile(canvasElement).getByText("예상 발송일", { exact: false })).toBeVisible();

    const production = canvas.getByRole("button", { name: /생산/ });
    await expect(production).toHaveAttribute("aria-expanded", "true");
    await expect(mobile(canvasElement).getByText(/생산 준비 완료, 원자재 검수/)).toBeVisible();

    const inspection = canvas.getByRole("button", { name: /검수/ });
    await expect(inspection).toHaveAttribute("aria-expanded", "false");
  },
};

/** 아직 시작하지 않은 단계를 펼치면 `예상 시작일` 한 줄만 보이고 기록은 없다. */
export const FutureStageExpanded: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /생산/ }));
    await userEvent.click(canvas.getByRole("button", { name: /배송/ }));
    await expect(canvas.getByRole("button", { name: /생산/ })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await expect(mobile(canvasElement).getByText(/^예상 시작일/)).toBeVisible();
  },
};

/** 완료된 단계를 펼치면 기간과 타임라인이 보인다. */
export const DoneStageExpanded: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /생산/ }));
    await userEvent.click(canvas.getByRole("button", { name: /제작 착수/ }));
    await expect(mobile(canvasElement).queryByText("업데이트")).not.toBeInTheDocument();
    await expect(
      mobile(canvasElement).getByText(/제작 착수 확정, 생산팀 및 발주 정보/),
    ).toBeVisible();
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
    await expect(mobile(canvasElement).getByText("아직 등록된 기록이 없어요.")).toBeVisible();
  },
};

/** 1200px 이상 — 현재 단계 문구와 카드 아코디언이 보이고, 라이트박스는 한 번만 열린다. */
export const Desktop: Story = {
  args: { fundingId: "demo-funding" },
  parameters: { viewport: { defaultViewport: "desktop" } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { level: 1, name: "제작·배송 현황" })).toBeVisible();
    await userEvent.click(canvas.getAllByRole("button", { name: /크게 보기$/ })[0]);
    await expect(canvas.getAllByRole("dialog")).toHaveLength(1);
  },
};
