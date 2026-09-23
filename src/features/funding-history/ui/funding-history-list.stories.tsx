import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { FundingHistoryList } from "./funding-history-list";

const meta = {
  title: "Features/Funding History/List",
  component: FundingHistoryList,
  /* 기본 기간이 "최근 한 달"이라 오늘 날짜로 거르면 고정된 목업 결제일(08-18 ~ 09-15)이 날마다
     범위를 벗어난다. Figma 카드 4개가 모두 보이는 기준일로 고정한다. */
  args: { referenceDate: "2026-09-18" },
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
  decorators: [
    (Story) => (
      <div className="bg-layer-bg py-6">
        <Story />
      </div>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof FundingHistoryList>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Desktop: Story = { globals: { viewport: { value: "desktop" } } };

/** 진입 기본값 — Figma의 4개 상태 카드와 액션 구성을 보여준다. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "참여/배송 내역" })).toBeVisible();
    await expect(canvas.getByText("총 4개")).toBeVisible();

    await expect(canvas.getByRole("heading", { name: "펀딩 진행 중" })).toBeVisible();
    await expect(canvas.getByRole("heading", { name: "펀딩 완료" })).toBeVisible();
    await expect(canvas.getByRole("heading", { name: "배송 중" })).toBeVisible();

    const shippingActions = canvas.getByRole("heading", { name: "배송 중" }).closest("article")!;
    await expect(
      within(shippingActions).getByRole("link", { name: "제작·배송 현황" }),
    ).toHaveAttribute("href", "/my/fundings/shipping/fulfillment");
    await expect(within(shippingActions).queryByRole("link", { name: "펀딩 취소" })).toBeNull();
  },
};

/** 검색어로 제목에 매칭되지 않으면 빈 상태 문구를 보여준다. */
export const SearchNoResult: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByPlaceholderText("검색어를 입력하세요"),
      "존재하지않는프로젝트",
    );
    await expect(canvas.getByText("조건에 맞는 참여 내역이 없어요.")).toBeVisible();
    await expect(canvas.getByText("총 0개")).toBeVisible();
  },
};

/** 상태 필터를 배송 완료로 바꾸면 해당 카드만 남고 환불·현황 버튼을 보여준다. */
export const FilterByStatus: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "상태 필터" }));
    await userEvent.click(canvas.getByRole("option", { name: "배송 완료" }));
    await expect(canvas.getByText("총 1개")).toBeVisible();
    await expect(canvas.getByRole("heading", { name: "배송 완료" })).toBeVisible();
    await expect(canvas.queryByRole("heading", { name: "펀딩 진행 중" })).toBeNull();
    await expect(canvas.getByRole("link", { name: /펀딩 환불/ })).toHaveAttribute(
      "href",
      "/my/fundings/delivered/refund/new?type=defect",
    );
  },
};
