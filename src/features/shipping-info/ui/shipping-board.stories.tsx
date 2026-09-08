import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { demoShipments } from "../model/shipping-demo";
import { ShippingBoard } from "./shipping-board";

const meta = {
  title: "Features/Shipping Info",
  component: ShippingBoard,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="bg-layer-bg p-6">
        <Story />
      </div>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof ShippingBoard>;
export default meta;

type Story = StoryObj<typeof meta>;

/** 기본 목록 — 발송 대기 6건과 발송 완료 2건이 섞여 있다. */
export const Default: Story = {};

/** 발송 완료만 있는 목록 — 전체 선택 체크박스가 비활성이다. */
export const AllShipped: Story = {
  args: {
    initialShipments: demoShipments().map((shipment) => ({
      ...shipment,
      courier: "한진택배" as const,
      trackingNo: "1234567890",
      status: "shipped" as const,
    })),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText("발송 대기 주문 전체 선택")).toBeDisabled();
  },
};

/** 택배사·운송장을 채워야 `발송 처리`가 열린다. */
export const ShipOneRow: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const orderNo = demoShipments()[0].orderNo;
    const row = canvas.getByLabelText(`주문 ${orderNo} 선택`).closest("tr")!;
    const cells = within(row);
    const ship = cells.getByRole("button", { name: "발송 처리" });

    await expect(ship).toBeDisabled();
    await userEvent.selectOptions(cells.getByLabelText(`주문 ${orderNo} 택배사`), "롯데택배");
    await expect(ship).toBeDisabled();

    await userEvent.type(cells.getByLabelText(`주문 ${orderNo} 운송장 번호`), "1234567890");
    await expect(ship).toBeEnabled();

    await userEvent.click(ship);
    await expect(cells.getByRole("button", { name: "발송 완료" })).toBeDisabled();
  },
};

/** 행을 고르면 선택 개수와 일괄 조작 컨트롤이 나타난다. */
export const BulkSelection: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const orderNo = demoShipments()[0].orderNo;

    await expect(canvas.queryByLabelText("선택한 주문의 택배사")).not.toBeInTheDocument();
    await userEvent.click(canvas.getByLabelText(`주문 ${orderNo} 선택`));

    await expect(canvas.getByText("1 개 선택 됨")).toBeVisible();
    await userEvent.selectOptions(canvas.getByLabelText("선택한 주문의 택배사"), "경동택배");
    await expect(canvas.getByLabelText(`주문 ${orderNo} 택배사`)).toHaveValue("경동택배");
  },
};

/** 검색은 주문번호·서포터·배송지에서 찾고 탭 건수도 함께 줄어든다. */
export const Search: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("주문 검색"), "해운대");

    const rows = canvas.getAllByRole("row").slice(1); // 헤더 제외
    await expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) await expect(within(row).getByText(/해운대/)).toBeVisible();
  },
};

/** 검색 결과가 없으면 빈 상태 문구를 보여준다. */
export const NoResult: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("주문 검색"), "없는주문");
    await expect(canvas.getByText("조건에 맞는 주문이 없습니다.")).toBeVisible();
  },
};
