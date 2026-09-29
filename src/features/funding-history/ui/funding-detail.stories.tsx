import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { toFundingDetailView } from "../model/funding-history";
import { demoOrderDetail } from "../model/funding-orders-demo";
import { FundingDetail } from "./funding-detail";

const inProgress = toFundingDetailView(demoOrderDetail("in_progress"));
const delivered = demoOrderDetail("delivered");

const meta = {
  title: "Features/Funding History/Detail",
  component: FundingDetail,
  args: { detail: inProgress },
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
} satisfies Meta<typeof FundingDetail>;
export default meta;

type Story = StoryObj<typeof meta>;

function infoRow(canvasElement: HTMLElement, label: string) {
  return within(canvasElement).getByText(label, { selector: "dt" }).nextElementSibling;
}

/** FL_B_MY_FUND_MNG. 주문번호·창작자는 상세 응답에 없어 두지 않는다. 참여일은 BE #181의 createdAt이다. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "펀딩 상세 내역" })).toBeVisible();
    await expect(canvas.queryByText(/^FD/)).toBeNull();
    /* 펀딩 정보의 첫 줄은 참여일, 다음이 결제일이다(2323:53162). */
    const labels = [...canvasElement.querySelectorAll("dt")].map((dt) => dt.textContent);
    await expect(labels.slice(0, 2)).toEqual(["참여일", "결제일"]);
    await expect(infoRow(canvasElement, "참여일")).toHaveTextContent("2026.09.15");
    await expect(infoRow(canvasElement, "결제일")).toHaveTextContent("2026.09.15");
    await expect(canvas.getByText("단일옵션 · 1개")).toBeVisible();
    await expect(canvas.getByRole("link", { name: "참여 취소" })).toHaveAttribute(
      "href",
      "/my/fundings/in_progress/cancel",
    );
    await expect(canvas.getByRole("link", { name: "제작·배송 현황" })).toHaveAttribute(
      "href",
      "/my/fundings/in_progress/fulfillment",
    );
  },
};

export const Delivered: Story = {
  args: { detail: toFundingDetailView(delivered) },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("link", { name: "반품·교환 신청" }),
    ).toHaveAttribute("href", "/my/fundings/delivered/refund/new");
  },
};

/** 수령 후 7일이 지나 서버가 반품·교환 액션을 주지 않는 배송 완료 주문. */
export const ReturnPeriodOver: Story = {
  args: { detail: toFundingDetailView({ ...delivered, availableActions: [] }) },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("button", { name: "반품·교환 가능 기간이 지났어요" }),
    ).toBeDisabled();
  },
};

/** 리워드가 여럿이면 펀딩 정보의 리워드·옵션·수량 행을 반복하고 상단은 첫 리워드 외 N건이다. */
export const MultipleRewards: Story = {
  args: {
    detail: toFundingDetailView({
      ...delivered,
      paidAt: undefined,
      lineItems: [
        ...delivered.lineItems,
        {
          rewardId: 2,
          rewardName: "여행용 미니 바디미스트",
          quantity: 2,
          unitPrice: 9_000,
          options: [{ optionGroupName: "향", optionValue: "화이트 머스크" }],
        },
      ],
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("바디미스트 2종 세트 외 1건")).toBeVisible();
    await expect(canvas.getAllByText("리워드")).toHaveLength(2);
    await expect(canvas.getByText("향 화이트 머스크 · 2개")).toBeVisible();
    await expect(canvas.queryByText("결제일")).toBeNull();
  },
};

/** BE #181 전 응답처럼 createdAt이 없으면 참여일 행을 숨긴다. */
export const WithoutParticipationDate: Story = {
  args: {
    detail: toFundingDetailView({ ...demoOrderDetail("in_progress"), createdAt: undefined }),
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByText("참여일")).toBeNull();
    await expect(infoRow(canvasElement, "결제일")).toHaveTextContent("2026.09.15");
  },
};

export const Desktop: Story = {
  globals: { viewport: { value: "desktop" } },
  play: async ({ canvasElement }) => {
    await expect(infoRow(canvasElement, "참여일")).toHaveTextContent("2026.09.15");
  },
};
