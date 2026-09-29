import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState, type ComponentProps } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import type { OrderRefundRequest } from "@/entities/order/api/order-api";
import { fundingStageLabels, toFundingCard } from "../model/funding-history";
import { categoryStages, relativePeriodRange } from "../model/funding-history-filter";
import { demoOrderSummaries, demoOrderSummary } from "../model/funding-orders-demo";
import { FundingHistoryList } from "./funding-history-list";

const figmaCards = demoOrderSummaries().map(toFundingCard);
const today = "2026-09-29";
const defaultFilter = { q: "", category: "all" as const, ...relativePeriodRange("1m", today) };

/* 실제 화면은 조건이 바뀌면 URL을 바꿔 거른 목록을 다시 받는다. 스토리에서는 이 부모가 그 역할을
   대신해 조건을 들고, 검색어와 진행 단계 분류(제작 중·발송 지연·배송 중·배송 완료)로 args.cards를 거른다.
   기간과 주문 상태 분류는 카드에 값이 없어 거르지 않는다. */
function ServerFilteredList(args: ComponentProps<typeof FundingHistoryList>) {
  const [filter, setFilter] = useState(args.filter);
  const stages = categoryStages(filter.category);
  const cards = args.cards.filter(
    (card) =>
      card.projectTitle.includes(filter.q) &&
      (!stages || stages.some((stage) => card.stage === fundingStageLabels[stage])),
  );
  return (
    <FundingHistoryList
      {...args}
      cards={cards}
      total={filter.q || stages ? cards.length : args.total}
      filter={filter}
      onSearch={(q) => {
        setFilter((current) => ({ ...current, q }));
        args.onSearch(q);
      }}
      onPeriodChange={(range) => {
        setFilter((current) => ({ ...current, ...range }));
        args.onPeriodChange(range);
      }}
      onCategoryChange={(category) => {
        setFilter((current) => ({ ...current, category }));
        args.onCategoryChange(category);
      }}
    />
  );
}

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
  render: (args) => <ServerFilteredList {...args} />,
  args: {
    cards: figmaCards,
    total: figmaCards.length,
    filter: defaultFilter,
    today,
    onSearch: fn(),
    onPeriodChange: fn(),
    onCategoryChange: fn(),
  },
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

/** Figma FUND_1의 검색창·기간·분류 드롭다운과 네 카드. 성립 후 제작 준비 단계 배지는 "제작 중"이다. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "참여/배송 내역" })).toBeVisible();
    await expect(canvas.getByText("총 4개")).toBeVisible();
    await expect(canvas.getByRole("textbox", { name: "참여 내역 검색" })).toBeVisible();
    await expect(canvas.getByPlaceholderText("검색어를 입력하세요")).toBeVisible();
    await expect(canvas.getByRole("button", { name: "기간 필터" })).toHaveTextContent("최근 한 달");
    await expect(canvas.getByRole("button", { name: "분류 필터" })).toHaveTextContent("전체");
    await expect(canvas.getByText("제작 중")).toBeVisible();
    await expect(canvas.queryByText("펀딩 성공")).toBeNull();

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

/** 조건에 맞는 내역이 없어도 검색창·기간 드롭다운은 그대로 둔다. */
export const Empty: Story = {
  args: { cards: [], total: 0 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("총 0개")).toBeVisible();
    await expect(canvas.getByText("조건에 맞는 참여 내역이 없습니다.")).toBeVisible();
    await expect(canvas.getByRole("textbox", { name: "참여 내역 검색" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "기간 필터" })).toBeVisible();
  },
};

/** 첫 목록을 기다리는 동안에도 조건 줄은 두고, 건수 자리는 비운다. */
export const Pending: Story = {
  args: { cards: [], total: 0, pending: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("status")).toHaveTextContent("참여 내역을 불러오고 있습니다.");
    await expect(canvas.queryByText(/^총 /)).toBeNull();
    await expect(canvas.getByRole("textbox", { name: "참여 내역 검색" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "기간 필터" })).toBeVisible();
  },
};

/** 다음 페이지나 새 조건을 기다리는 동안 이전 목록을 두고 조건 줄 아래에 안내한다. */
export const LoadingNextPage: Story = {
  args: { loading: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("status")).toHaveTextContent("목록을 불러오고 있습니다.");
    await expect(canvasElement.querySelector("[aria-busy='true']")).not.toBeNull();
  },
};

/** Enter로 검색어를 적용하고, 지우기 버튼은 입력만 비운다. 빈 검색어로 다시 적용하면 조건이 풀린다. */
export const Search: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "참여 내역 검색" });
    await userEvent.type(input, "  콜라겐 {Enter}");
    await expect(args.onSearch).toHaveBeenLastCalledWith("콜라겐");
    await expect(input).toHaveValue("콜라겐");
    await expect(canvas.getByText("총 1개")).toBeVisible();
    await expect(canvas.getAllByRole("article")).toHaveLength(1);

    await userEvent.click(canvas.getByRole("button", { name: "검색어 지우기" }));
    await expect(input).toHaveValue("");
    await expect(canvas.getByText("총 1개")).toBeVisible();
    await userEvent.type(input, "{Enter}");
    await expect(args.onSearch).toHaveBeenLastCalledWith("");
    await expect(canvas.getByText("총 4개")).toBeVisible();
  },
};

/** FUND_2(2323:52510): 기간 드롭다운을 열고 최근 3개월을 고른다. */
export const ChoosePeriod: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "기간 필터" });
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(canvas.getAllByRole("option").map((option) => option.textContent)).toEqual([
      "최근 한 달",
      "최근 3개월",
      "최근 6개월",
      "최근 1년",
      "기간 선택",
    ]);
    await userEvent.click(canvas.getByRole("option", { name: "최근 3개월" }));
    await expect(args.onPeriodChange).toHaveBeenLastCalledWith({
      period: "3m",
      from: "2026-06-29",
      to: "2026-09-29",
    });
    await expect(trigger).toHaveTextContent("최근 3개월");
    await expect(canvas.queryByRole("listbox")).toBeNull();
  },
};

async function openPeriodSheet(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole("button", { name: "기간 필터" }));
  await userEvent.click(canvas.getByRole("option", { name: "기간 선택" }));
  return within(canvas.getByRole("dialog", { name: "기간 선택" }));
}

/** "기간 선택": 적용 중인 기간으로 열고, 시작일이 종료일보다 늦으면 적용을 막는다. 종료일은 오늘까지다. */
export const CustomPeriod: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const sheet = await openPeriodSheet(canvasElement);
    await expect(sheet.getByRole("button", { name: "시작일 2026.08.29" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(sheet.getByRole("button", { name: "종료일 2026.09.29" })).toBeVisible();

    await userEvent.click(sheet.getByRole("button", { name: "다음 달로 이동" }));
    await userEvent.click(sheet.getByRole("button", { name: /2026년 9월 10일/ }));
    /* 시작일을 고르면 종료일로 넘어간다. */
    await expect(sheet.getByRole("button", { name: "종료일 2026.09.29" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(sheet.getByRole("button", { name: /2026년 9월 30일/ })).toBeDisabled();

    await userEvent.click(sheet.getByRole("button", { name: /2026년 9월 5일/ }));
    await expect(sheet.getByRole("alert")).toHaveTextContent(
      "시작일은 종료일보다 늦을 수 없습니다.",
    );
    await expect(sheet.getByRole("button", { name: "적용" })).toBeDisabled();

    await userEvent.click(sheet.getByRole("button", { name: /2026년 9월 20일/ }));
    await expect(sheet.queryByRole("alert")).toBeNull();
    await userEvent.click(sheet.getByRole("button", { name: "적용" }));
    await expect(args.onPeriodChange).toHaveBeenLastCalledWith({
      period: "custom",
      from: "2026-09-10",
      to: "2026-09-20",
    });
    await expect(canvas.queryByRole("dialog")).toBeNull();
    await expect(canvas.getByRole("button", { name: "기간 필터" })).toHaveTextContent(
      "2026.09.10 ~ 2026.09.20",
    );
  },
};

/** 취소하면 고르던 날짜를 버리고 이전 기간을 유지한다. */
export const CancelCustomPeriod: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const sheet = await openPeriodSheet(canvasElement);
    await userEvent.click(sheet.getByRole("button", { name: /2026년 8월 31일/ }));
    await userEvent.click(sheet.getByRole("button", { name: "취소" }));
    await expect(canvas.queryByRole("dialog")).toBeNull();
    await expect(args.onPeriodChange).not.toHaveBeenCalled();
    await expect(canvas.getByRole("button", { name: "기간 필터" })).toHaveTextContent("최근 한 달");
  },
};

/** URL에 직접 기간·검색어·분류가 있는 상태. 가장 긴 기간·분류 문구도 390px 한 줄에 들어간다. */
export const CustomPeriodApplied: Story = {
  args: {
    filter: {
      q: "크림",
      category: "payment_expired",
      period: "custom",
      from: "2026-09-01",
      to: "2026-09-15",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const period = canvas.getByRole("button", { name: "기간 필터" });
    await expect(period).toHaveTextContent("2026.09.01 ~ 2026.09.15");
    await expect(canvas.getByRole("button", { name: "분류 필터" })).toHaveTextContent(
      "결제 기한 만료",
    );
    await expect(canvas.getByRole("textbox", { name: "참여 내역 검색" })).toHaveValue("크림");
    await expect(canvas.getByText("총 1개")).toBeVisible();
    const row = canvas.getByText("총 1개").parentElement!;
    await expect(row.scrollWidth).toBeLessThanOrEqual(row.clientWidth);
    await expect(period.textContent).not.toContain("…");
  },
};

/** FUND_3(2323:52651): 분류를 열어 제작 중을 고르면 성립 후 제작 준비 단계 카드만 남는다. */
export const ChooseCategory: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "분류 필터" });
    await userEvent.click(trigger);
    await expect(canvas.getAllByRole("option").map((option) => option.textContent)).toEqual([
      "전체",
      "펀딩 진행 중",
      "펀딩 성공",
      "제작 중",
      "발송 지연",
      "배송 중",
      "배송 완료",
      "펀딩 목표 미달",
      "참여 취소",
      "결제 기한 만료",
      "환불 완료",
    ]);
    await userEvent.click(canvas.getByRole("option", { name: "제작 중" }));
    await expect(args.onCategoryChange).toHaveBeenLastCalledWith("producing");
    await expect(trigger).toHaveTextContent("제작 중");
    await expect(canvas.getByText("총 1개")).toBeVisible();
    const articles = canvas.getAllByRole("article");
    await expect(articles).toHaveLength(1);
    await expect(within(articles[0]).getByText("제작 중")).toBeVisible();
  },
};

/** 진행 단계 분류에서 받을 수 있는 최대 건수(2,000건)에 닿았을 때 그 안에서만 찾았다고 알린다. */
export const TruncatedStageFilter: Story = {
  args: { truncated: true, filter: { ...defaultFilter, category: "delivered" } },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText("참여 내역이 많아 최근 2,000건 안에서만 찾았습니다."),
    ).toBeVisible();
  },
};

export const Desktop: Story = {
  globals: { viewport: { value: "desktop" } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "참여/배송 내역", level: 1 })).toBeVisible();
    await expect(canvas.getByRole("textbox", { name: "참여 내역 검색" })).toBeVisible();
    await expect(canvas.getByText("총 4개")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "기간 필터" }));
    await expect(canvas.getAllByRole("option")).toHaveLength(5);
    await userEvent.click(canvas.getByRole("button", { name: "분류 필터" }));
    await expect(canvas.getAllByRole("option")).toHaveLength(11);
  },
};
