import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import type { OrderRefundRequest } from "@/entities/order/api/order-api";
import { toFundingCard } from "../model/funding-history";
import { demoOrderSummaries, demoOrderSummary } from "../model/funding-orders-demo";
import { FundingHistoryList } from "./funding-history-list";

const figmaCards = demoOrderSummaries().map(toFundingCard);

function requested(triggerType: string, status = "REQUESTED"): OrderRefundRequest[] {
  return [{ refundId: 1, triggerType, status, requestedAt: "2026-09-20T01:00:00Z" }];
}

/* 정리표 "진행 단계 별 노출 될 버튼"(2323:53727)의 카드와 정리표에 없는 단계를 한 목록에 모은다. */
const stageCards = [
  demoOrderSummary("in_progress"),
  demoOrderSummary("in_progress", {
    orderId: "cancelled",
    status: "CANCELLED_BY_MEMBER",
    progressStage: "CANCELLED",
    availableActions: [],
    refundRequests: requested("SIMPLE_CHANGE_OF_MIND", "COMPLETED"),
  }),
  demoOrderSummary("completed"),
  demoOrderSummary("completed", {
    orderId: "delayed",
    progressStage: "SHIPPING_DELAYED",
    availableActions: ["SHIPPING_DELAY_REFUND_REQUEST"],
  }),
  demoOrderSummary("completed", {
    orderId: "delayed-requested",
    progressStage: "SHIPPING_DELAYED",
    availableActions: ["SHIPPING_DELAY_REFUND_REQUEST"],
    refundRequests: requested("SHIPPING_DELAY"),
  }),
  demoOrderSummary("shipping"),
  demoOrderSummary("delivered"),
  demoOrderSummary("delivered", {
    orderId: "delivered-requested",
    refundRequests: requested("EXCHANGE"),
  }),
  demoOrderSummary("delivered", { orderId: "delivered-expired", availableActions: [] }),
  demoOrderSummary("in_progress", {
    orderId: "goal-failed",
    status: "GOAL_FAILED_REFUNDED",
    progressStage: "GOAL_FAILED",
    availableActions: [],
  }),
  demoOrderSummary("in_progress", { orderId: "pending", status: "PENDING", paidAt: undefined }),
].map(toFundingCard);

const meta = {
  title: "Features/Funding History/List",
  component: FundingHistoryList,
  args: { cards: figmaCards, total: figmaCards.length },
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
    viewport: {
      options: {
        figma390: { name: "Figma 390 × 844", styles: { width: "390px", height: "844px" } },
        desktop: { name: "Desktop 1440 × 900", styles: { width: "1440px", height: "900px" } },
      },
    },
  },
  globals: { viewport: { value: "figma390" } },
  tags: ["autodocs"],
} satisfies Meta<typeof FundingHistoryList>;
export default meta;

type Story = StoryObj<typeof meta>;

function card(canvasElement: HTMLElement, title: string, index = 0) {
  return within(canvasElement).getAllByRole("heading", { name: title })[index].closest("article")!;
}

/** Figma FUND_1의 네 카드. 서버 필터가 없어 검색·기간·분류는 두지 않는다. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "참여/배송 내역" })).toBeVisible();
    await expect(canvas.getByText("총 4개")).toBeVisible();
    await expect(canvas.queryByPlaceholderText("검색어를 입력하세요")).toBeNull();
    await expect(canvas.getByText("펀딩 성공")).toBeVisible();

    const inProgress = within(card(canvasElement, figmaCards[0].projectTitle));
    await expect(inProgress.getByText("2026.09.15")).toBeVisible();
    await expect(inProgress.getByRole("link", { name: "펀딩 상세" })).toHaveAttribute(
      "href",
      "/my/fundings/in_progress",
    );
    await expect(inProgress.getByRole("link", { name: "참여 취소" })).toHaveAttribute(
      "href",
      "/my/fundings/in_progress/cancel",
    );

    const delivered = within(card(canvasElement, figmaCards[3].projectTitle));
    await expect(delivered.getByRole("link", { name: "반품·교환 신청" })).toHaveAttribute(
      "href",
      "/my/fundings/delivered/refund/new",
    );
    await expect(delivered.getByRole("link", { name: "제작·배송 현황" })).toHaveAttribute(
      "href",
      "/my/fundings/delivered/fulfillment",
    );
  },
};

/** 단계·신청 여부·수령 후 7일 경과별 버튼(정리표 2323:53727)과 정리표에 없는 단계. */
export const StageButtons: Story = {
  args: { cards: stageCards, total: stageCards.length },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("총 11개")).toBeVisible();

    const cancelled = within(canvasElement.querySelectorAll("article")[1] as HTMLElement);
    await expect(cancelled.getByText("참여 취소")).toBeVisible();
    await expect(cancelled.getByRole("link", { name: "취소 내역" })).toHaveAttribute(
      "href",
      "/my/refunds?type=cancel",
    );

    const delayed = within(canvasElement.querySelectorAll("article")[3] as HTMLElement);
    await expect(delayed.getByText("발송 지연")).toBeVisible();
    await expect(delayed.getByRole("link", { name: "참여 취소" })).toHaveAttribute(
      "href",
      "/my/fundings/delayed/cancel",
    );

    const exchangeRequested = within(canvasElement.querySelectorAll("article")[7] as HTMLElement);
    await expect(exchangeRequested.getByRole("link", { name: "반품·교환 내역" })).toHaveAttribute(
      "href",
      "/my/refunds?type=exchange",
    );
    await expect(exchangeRequested.queryByRole("link", { name: "반품·교환 신청" })).toBeNull();

    const expired = within(canvasElement.querySelectorAll("article")[8] as HTMLElement);
    await expect(
      expired.getByRole("button", { name: "반품·교환 가능 기간이 지났어요" }),
    ).toBeDisabled();
    await expect(expired.queryByRole("link", { name: "제작·배송 현황" })).toBeNull();

    const goalFailed = within(canvasElement.querySelectorAll("article")[9] as HTMLElement);
    await expect(goalFailed.getByText("펀딩 목표 미달")).toBeVisible();
    await expect(goalFailed.getByRole("link", { name: "환불 내역" })).toHaveAttribute(
      "href",
      "/my/refunds",
    );

    /* 결제 대기는 BE가 진행 중 단계로 주고, 결제 전이라 결제일이 없다. */
    const pending = within(canvasElement.querySelectorAll("article")[10] as HTMLElement);
    await expect(pending.getByText("펀딩 진행 중")).toBeVisible();
    await expect(pending.queryByText("결제일")).toBeNull();
  },
};

export const Empty: Story = {
  args: { cards: [], total: 0 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("총 0개")).toBeVisible();
    await expect(canvas.getByText("참여 내역이 없습니다.")).toBeVisible();
  },
};

/** 다음 페이지를 기다리는 동안 이전 목록을 두고 안내한다. */
export const LoadingNextPage: Story = {
  args: { loading: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("status")).toHaveTextContent("목록을 불러오고 있습니다.");
    await expect(canvasElement.querySelector("[aria-busy='true']")).not.toBeNull();
  },
};

export const Desktop: Story = { globals: { viewport: { value: "desktop" } } };
