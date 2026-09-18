import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { demoFundingDetail } from "@/features/funding-history/model/funding-history";
import { demoBuyerFulfillmentState } from "../model/fulfillment-demo";
import type { BuyerFulfillmentState } from "../model/fulfillment-demo";
import { BuyerFulfillmentSummary } from "./buyer-fulfillment-summary";

/* Figma 기준일로 목업과 날짜 의존 상태를 고정한다. */
const today = "2026-09-28";

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
    await expect(
      canvas.getByRole("heading", { name: demoFundingDetail("demo-funding").projectTitle }),
    ).toBeVisible();

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
    await expect(canvas.getByText("업데이트 예정")).toBeVisible();
    await expect(canvas.getByText(/마지막 업데이트 \d+일 전/)).toBeVisible();
    await expect(canvas.queryByText("제작 진행 상황을 업데이트해주세요")).not.toBeInTheDocument();
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

/** 동영상 첨부를 타임라인에 표시하고 라이트박스로 연결한다. */
export const VideoAttachment: Story = {
  args: {
    today,
    initialState: stateWith((state) => {
      state.stages.production.records[1].media.push({
        id: "production-video",
        kind: "video",
        name: "line-check.mp4",
        url: null,
      });
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "line-check.mp4 동영상 크게 보기" }));
    await expect(canvas.getByRole("dialog", { name: "line-check.mp4" })).toBeVisible();
  },
};

/** 아직 시작하지 않은 첫 단계는 진행 중으로 표현하지 않는다. */
export const NotStarted: Story = {
  args: {
    today,
    initialState: stateWith((state) => {
      for (const stage of Object.values(state.stages)) stage.status = "todo";
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText(
        (_, element) =>
          element?.tagName === "P" && element.textContent === "제작 착수 시작 전이에요",
      ),
    ).toBeVisible();
    await expect(canvas.queryByText(/제작 착수 중 이에요/)).not.toBeInTheDocument();
  },
};

/** 모든 단계 완료 시 완료 문구를 표시하고 지난 예정일 안내를 숨긴다. */
export const Completed: Story = {
  args: {
    today,
    initialState: stateWith((state) => {
      for (const stage of Object.values(state.stages)) stage.status = "done";
      state.stages.delivery.expectedEndDate = "2026-08-27";
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("제작·배송이 완료됐어요")).toBeVisible();
    await expect(canvas.queryByText(/완료 예정일/)).not.toBeInTheDocument();
  },
};

/** Figma 1165:15459의 과거 사진 기록을 펼친 상태. */
export const ExpandedPhotoRecord: Story = {
  args: { today },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "09월 21일 기록 펼치기" }));
    await userEvent.click(canvas.getByRole("button", { name: "material-1.jpg 사진 크게 보기" }));
    await expect(canvas.getByRole("dialog", { name: "material-1.jpg" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "material-1.jpg 닫기" }));
    await expect(canvas.queryByRole("dialog")).not.toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "09월 21일 기록 접기" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  },
};

/** 긴 기록을 펼치면 3줄을 초과해도 본문 전체를 읽을 수 있다. */
export const LongRecord: Story = {
  args: {
    today,
    initialState: stateWith((state) => {
      state.stages.production.records[0].text =
        "첫 번째 기록\n두 번째 기록\n세 번째 기록\n네 번째 기록\n마지막 기록";
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "09월 25일 기록 펼치기" }));
    const text = canvas.getByText(/마지막 기록/);
    await expect(text).toBeVisible();
    await expect(getComputedStyle(text).webkitLineClamp).toBe("none");
    await userEvent.click(canvas.getByRole("button", { name: "09월 25일 기록 접기" }));
    await expect(getComputedStyle(canvas.getByText(/마지막 기록/)).whiteSpace).toBe("nowrap");
  },
};
