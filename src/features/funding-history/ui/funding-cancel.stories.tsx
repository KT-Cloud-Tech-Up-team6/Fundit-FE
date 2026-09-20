import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { FundingCancel } from "./funding-cancel";

const meta = {
  title: "Features/Funding History/Cancel",
  component: FundingCancel,
  args: { fundingId: "in_progress" },
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
} satisfies Meta<typeof FundingCancel>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Desktop: Story = { globals: { viewport: { value: "desktop" } } };

/** 진입 기본값 — 사유를 고르기 전에는 취소 신청 버튼이 비활성이다. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "펀딩 취소" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "취소 신청" })).toBeDisabled();
    await expect(canvas.getByText("실 환불 금액").nextElementSibling).toHaveTextContent("32,000원");
    await expect(canvas.queryByText("사진 첨부 (선택)")).not.toBeInTheDocument();
  },
};

/** 사유를 고르면 취소 신청이 활성화되고, 누르면 확인 모달이 뜬다. */
export const ConfirmDialog: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.selectOptions(canvas.getByRole("combobox"), "단순 변심");

    const submit = canvas.getByRole("button", { name: "취소 신청" });
    await expect(submit).toBeEnabled();
    await userEvent.click(submit);

    await expect(canvas.getByText("펀딩을 취소할까요?")).toBeVisible();
  },
};

/** "닫기"를 누르면 모달만 닫히고 화면은 그대로 남는다. */
export const DismissConfirm: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.selectOptions(canvas.getByRole("combobox"), "단순 변심");
    await userEvent.click(canvas.getByRole("button", { name: "취소 신청" }));
    await userEvent.click(canvas.getByRole("button", { name: "닫기" }));
    // 네이티브 <dialog>는 close() 해도 DOM에는 남고 display:none으로만 숨는다.
    await expect(canvas.getByText("펀딩을 취소할까요?")).not.toBeVisible();
  },
};

/** 반품/교환 variant는 유형·사유를 선택해야 신청할 수 있다. */
export const ReturnVariant: Story = {
  args: { fundingId: "delivered", variant: "return" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "펀딩 반품/교환" })).toBeVisible();
    await expect(canvas.getByText("사진 첨부 (선택)")).toBeVisible();
    await expect(canvas.getByText("배송비")).toBeVisible();

    const submit = canvas.getByRole("button", { name: "반품/교환 신청" });
    await expect(submit).toBeDisabled();
    await userEvent.selectOptions(canvas.getByRole("combobox", { name: "유형" }), "반품");
    await userEvent.selectOptions(canvas.getByRole("combobox", { name: "사유" }), "단순변심");
    await expect(submit).toBeEnabled();
    await userEvent.click(submit);

    const dialog = within(canvas.getByRole("dialog"));
    await expect(dialog.getByText("반품을 신청할까요?")).toBeVisible();
    await expect(dialog.getByRole("button", { name: "반품 신청" })).toBeVisible();
  },
};

/** 사유 옵션은 유형(반품/교환)에 따라 다르고, 유형을 바꾸면 이미 고른 사유는 초기화된다. */
export const ReturnReasonDependsOnType: Story = {
  args: { fundingId: "delivered", variant: "return" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const typeSelect = canvas.getByRole("combobox", { name: "유형" });
    const reasonSelect = canvas.getByRole("combobox", { name: "사유" });

    await userEvent.selectOptions(typeSelect, "반품");
    await userEvent.selectOptions(reasonSelect, "배송 지연");
    await expect(within(reasonSelect).getByText("배송 지연")).toBeVisible();

    await userEvent.selectOptions(typeSelect, "교환");
    await expect(within(reasonSelect).queryByText("배송 지연")).not.toBeInTheDocument();
    await userEvent.selectOptions(reasonSelect, "구성품 누락");
  },
};
