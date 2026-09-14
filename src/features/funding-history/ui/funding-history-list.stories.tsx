import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { FundingHistoryList } from "./funding-history-list";

const meta = {
  title: "Features/Funding History/List",
  component: FundingHistoryList,
  parameters: { layout: "fullscreen", nextjs: { appDirectory: true } },
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

/** 진입 기본값 — 4개 상태 카드가 모두 보이고 각 카드는 상태에 맞는 액션 버튼을 가진다. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "참여/배송 내역" })).toBeVisible();
    await expect(canvas.getByText("총 4개")).toBeVisible();

    await expect(canvas.getByRole("heading", { name: "펀딩 진행 중" })).toBeVisible();
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
      canvas.getByPlaceholderText("프로젝트를 검색해보세요"),
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
    await userEvent.selectOptions(canvas.getByLabelText("상태 필터"), "delivered");
    await expect(canvas.getByText("총 1개")).toBeVisible();
    await expect(canvas.getByRole("heading", { name: "배송 완료" })).toBeVisible();
    await expect(canvas.queryByRole("heading", { name: "펀딩 진행 중" })).toBeNull();
    await expect(canvas.getByRole("link", { name: /펀딩 환불/ })).toHaveAttribute(
      "href",
      "/my/fundings/delivered/refund/new?type=cancel",
    );
  },
};
