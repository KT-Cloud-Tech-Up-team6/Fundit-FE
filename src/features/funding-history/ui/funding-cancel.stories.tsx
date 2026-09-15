import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { FundingCancel } from "./funding-cancel";

const meta = {
  title: "Features/Funding History/Cancel",
  component: FundingCancel,
  args: { fundingId: "in_progress" },
  parameters: { layout: "fullscreen", nextjs: { appDirectory: true } },
  decorators: [
    (Story) => (
      <div className="bg-layer-bg py-6">
        <Story />
      </div>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof FundingCancel>;
export default meta;

type Story = StoryObj<typeof meta>;

/** 진입 기본값 — 사유를 고르기 전에는 저장 버튼이 비활성이다. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "참여 취소" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "저장" })).toBeDisabled();
    await expect(canvas.getByText("실 환불 금액").nextElementSibling).toHaveTextContent(
      "599,000원",
    );
  },
};

/** 사유를 고르면 저장이 활성화되고, 누르면 확인 모달이 뜬다. */
export const ConfirmDialog: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.selectOptions(canvas.getByRole("combobox"), "단순 변심");

    const submit = canvas.getByRole("button", { name: "저장" });
    await expect(submit).toBeEnabled();
    await userEvent.click(submit);

    await expect(canvas.getByText("정말 취소하시겠습니까?")).toBeVisible();
  },
};

/** "아니요"를 누르면 모달만 닫히고 화면은 그대로 남는다. */
export const DismissConfirm: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.selectOptions(canvas.getByRole("combobox"), "단순 변심");
    await userEvent.click(canvas.getByRole("button", { name: "저장" }));
    await userEvent.click(canvas.getByRole("button", { name: "아니요" }));
    // 네이티브 <dialog>는 close() 해도 DOM에는 남고 display:none으로만 숨는다.
    await expect(canvas.getByText("정말 취소하시겠습니까?")).not.toBeVisible();
  },
};
