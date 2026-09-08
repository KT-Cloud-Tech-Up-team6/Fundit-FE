import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { demoFulfillmentState } from "../model/fulfillment-demo";
import type { FulfillmentState } from "../model/fulfillment-demo";
import { FulfillmentBoard } from "./fulfillment-board";

/* 목업 기록 날짜는 오늘 기준 상대값이라, 스토리는 기준일을 고정해 상태를 만든다. */
const today = "2026-08-28";

/** 목업 기본 상태를 조금씩 바꿔 상태별 스토리를 만든다. */
function stateWith(change: (state: FulfillmentState) => void): FulfillmentState {
  const state = demoFulfillmentState(today);
  change(state);
  return state;
}

const meta = {
  title: "Features/Fulfillment Tracking",
  component: FulfillmentBoard,
  args: { projectId: "p-c1" },
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="bg-layer-bg p-6">
        <Story />
      </div>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof FulfillmentBoard>;
export default meta;

type Story = StoryObj<typeof meta>;

/** 진입 기본값 — 진행 중인 `제작 착수`가 선택돼 있고 기록 2건이 보인다. */
export const Default: Story = {
  args: { today },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const current = canvas.getByRole("button", { name: /제작 착수 단계, 진행 중/ });
    await expect(current).toHaveAttribute("aria-current", "step");
    await expect(canvas.getByRole("button", { name: "등록" })).toBeDisabled();
  },
};

/** 앞 단계가 끝나고 `생산`이 진행 중인 상태. 스텝퍼로 다른 단계를 열어볼 수 있다. */
export const MidProgress: Story = {
  args: {
    today,
    initialState: stateWith((state) => {
      state.prep.status = "done";
      state.production.status = "active";
      state.production.records = [
        {
          id: "production-1",
          date: "2026-08-28",
          text: "1차 생산 물량이 라인에 올라갔어요.",
          media: [],
        },
      ];
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /제작 착수 단계, 진행 완료/ }));
    await expect(canvas.getByRole("heading", { name: "제작 착수" })).toBeVisible();
  },
};

/** 기록이 아직 없는 단계 — 빈 타임라인 문구가 보인다. */
export const EmptyStage: Story = {
  args: {
    today,
    initialState: stateWith((state) => {
      state.prep.records = [];
    }),
  },
};

/** 마지막 기록 후 오래 지난 상태 — 선택 단계 패널 위에 정체 경고 배너가 뜬다. */
export const Stale: Story = {
  // 마지막 기록이 11일 전이 되도록 기준일을 앞당겨 상태를 만든다.
  args: { today: "2026-09-04", initialState: demoFulfillmentState("2026-08-27") },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("마지막 업데이트 후 11일이 지났어요.")).toBeVisible();
  },
};

/** 모든 단계가 끝난 상태 — 마지막 단계가 선택되고 `이 단계 완료`가 비활성이다. */
export const AllDone: Story = {
  args: {
    today,
    initialState: stateWith((state) => {
      for (const stage of Object.values(state)) stage.status = "done";
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "완료된 단계" })).toBeDisabled();
  },
};

/** 내용을 입력하면 `등록`이 활성화되고, 등록하면 타임라인에 기록이 쌓인다. */
export const ComposeRecord: Story = {
  args: { today },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText("단계에 추가될 내용을 적어주시와요");
    const submit = canvas.getByRole("button", { name: "등록" });

    await expect(submit).toBeDisabled();
    await userEvent.type(input, "포장 자재 검수를 마쳤어요.");
    await expect(submit).toBeEnabled();

    await userEvent.click(submit);
    await expect(canvas.getByText("포장 자재 검수를 마쳤어요.")).toBeVisible();
    await expect(submit).toBeDisabled();
  },
};

/** `지연 사유 등록`을 누르면 사유·상세·예상 완료일을 받는 모달이 열린다. */
export const DelayReason: Story = {
  args: { today },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "지연 사유 등록" }));

    const dialog = within(canvas.getByRole("dialog", { name: "지연 사유 등록" }));
    await userEvent.selectOptions(dialog.getByLabelText("지연 사유"), "재고 부족");
    await userEvent.type(dialog.getByLabelText("상세 사유"), "부자재 입고가 밀렸어요.");
    await userEvent.click(dialog.getByRole("button", { name: "저장" }));

    await expect(canvas.queryByRole("dialog")).not.toBeInTheDocument();
  },
};
