import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState, type ComponentProps } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import { refundSummariesDemo } from "../model/refunds-demo";
import { refundTypeOfFilter, toRefundEntry, type RefundFilterType } from "../model/refund-history";
import { BuyerRefunds } from "./buyer-refunds";

const entries = refundSummariesDemo.map(toRefundEntry);
const cancelled = "[진짜싹싹] 35,000Pa 초강력 흡입, 가볍게 끝내는 무선청소기";
const delayed = "키친모먼트 스테인리스 전기주전자";
const exchanged = "센트모먼트 바디미스트";
const returned = "벨라포뮬라 데일리 선크림";
const rejected = "센트모먼트 룸스프레이";

/* 실제 화면은 필터가 바뀌면 URL을 바꿔 서버가 거른 목록을 다시 받는다. 스토리에서는 이 부모가
   그 역할을 대신해 args.entries를 서버처럼 걸러, 드롭다운과 "진행 중만 보기"를 눌러 볼 수 있게 한다. */
function ServerFilteredRefunds(args: ComponentProps<typeof BuyerRefunds>) {
  const [type, setType] = useState<RefundFilterType>(args.type);
  const [inProgress, setInProgress] = useState(args.inProgress);
  const refundType = refundTypeOfFilter(type);
  const filtered = args.entries.filter(
    (entry) =>
      (!refundType || entry.type === refundType) && (!inProgress || entry.stage === "진행 중"),
  );
  return (
    <BuyerRefunds
      {...args}
      entries={filtered}
      total={filtered.length}
      type={type}
      onTypeChange={(next) => {
        setType(next);
        args.onTypeChange(next);
      }}
      inProgress={inProgress}
      onInProgressChange={(checked) => {
        setInProgress(checked);
        args.onInProgressChange(checked);
      }}
    />
  );
}

const meta = {
  title: "Features/BuyerRefunds",
  component: BuyerRefunds,
  render: (args) => <ServerFilteredRefunds {...args} />,
  args: {
    entries,
    total: entries.length,
    type: "all",
    onTypeChange: fn(),
    inProgress: false,
    onInProgressChange: fn(),
  },
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
} satisfies Meta<typeof BuyerRefunds>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Empty: Story = { args: { entries: [], total: 0 } };
export const Desktop: Story = { globals: { viewport: { value: "desktop" } } };

/** RFND_4(2323:53087): 유형 "취소"를 고른 뒤 서버가 취소 건만 돌려준 상태. */
export const FilteredCancel: Story = {
  args: {
    type: "cancel",
    entries: entries.filter((entry) => entry.type === "취소"),
    total: 2,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("총 2개")).toBeVisible();
    await expect(canvas.getByRole("button", { name: "유형 필터" })).toHaveTextContent("취소");
  },
};

export const ChooseType: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "유형 필터" }));
    const options = canvas.getAllByRole("option").map((option) => option.textContent);
    await expect(options).toEqual(["전체", "취소", "반품", "교환"]);
    await userEvent.click(canvas.getByRole("option", { name: "교환" }));
    await expect(args.onTypeChange).toHaveBeenCalledWith("exchange");
    await expect(canvas.getByRole("button", { name: "유형 필터" })).toHaveTextContent("교환");
    await expect(
      canvas.getByText(`총 ${entries.filter((e) => e.type === "교환").length}개`),
    ).toBeVisible();
    await expect(canvas.queryByText(cancelled)).not.toBeInTheDocument();
  },
};

export const ToggleInProgressOnly: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("radio", { name: "진행 중만 보기" }));
    await expect(args.onInProgressChange).toHaveBeenCalledWith(true);
    await expect(
      canvas.getByText(`총 ${entries.filter((e) => e.stage === "진행 중").length}개`),
    ).toBeVisible();
    await expect(canvas.queryByText(cancelled)).not.toBeInTheDocument();
  },
};

/** 필터·페이지를 바꾼 뒤 새 목록을 기다리는 동안: 이전 목록을 두고 필터 바로 아래에 알린다. */
export const LoadingNextList: Story = {
  args: { loading: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("status")).toHaveTextContent("목록을 불러오고 있습니다.");
    await expect(canvas.getByText(cancelled).closest("[aria-busy]")).toHaveAttribute(
      "aria-busy",
      "true",
    );
  },
};

export const ExpandHistory: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    /* RFND_1처럼 모두 접힌 채 시작하고, 누르면 RFND_2처럼 펼친다. */
    for (const details of canvasElement.querySelectorAll("details"))
      await expect(details).not.toHaveAttribute("open");
    const complete = canvas.getByText(cancelled).closest("details")!;
    await userEvent.click(canvas.getByText(cancelled));
    await expect(complete).toHaveAttribute("open");
    await expect(within(complete).getByText("참여 취소")).toBeVisible();
    await expect(
      within(complete).getByText("199,000원", { selector: "dd.text-title-s" }),
    ).toBeVisible();
    await userEvent.click(canvas.getByText(cancelled));
    await expect(complete).not.toHaveAttribute("open");

    const pending = canvas.getByText(delayed).closest("details")!;
    await userEvent.click(canvas.getByText(delayed));
    await expect(pending).toHaveAttribute("open");
    await expect(within(pending).getByText("발송 지연")).toBeVisible();
    await expect(within(pending).queryByText("실 환불 금액")).not.toBeInTheDocument();

    /* 교환은 완료돼도 환불이 없어 실 환불 금액을 보이지 않는다. */
    const exchange = canvas.getByText(exchanged).closest("details")!;
    await userEvent.click(canvas.getByText(exchanged));
    await expect(within(exchange).getByText("불량·하자 · 펌프가 눌리지 않습니다")).toBeVisible();
    await expect(within(exchange).queryByText("실 환불 금액")).not.toBeInTheDocument();

    const returning = canvas.getByText(returned).closest("details")!;
    await userEvent.click(canvas.getByText(returned));
    await expect(within(returning).getByText("옵션 선택 오류")).toBeVisible();

    const denied = canvas.getByText(rejected).closest("details")!;
    await userEvent.click(canvas.getByText(rejected));
    await expect(within(denied).getByText("제품 하자가 확인되지 않았습니다")).toBeVisible();
    await expect(within(denied).queryByText("실 환불 금액")).not.toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: "저장" })).not.toBeInTheDocument();
  },
};
