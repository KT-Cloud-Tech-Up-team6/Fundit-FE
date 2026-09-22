import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { FundingCancel } from "./funding-cancel";

const detail = {
  imageSrc: "",
  projectTitle: "키친모먼트 스테인리스 전기주전자",
  rewardOption: "얼리버드 스타터 세트",
  rewardQuantity: 1,
  amount: 32000,
};

/** `GET /api/v1/refunds/estimate` 응답을 옮긴 값. 적립금·취소 수수료는 계약이 없어 비어 있다. */
const refund = {
  pointRefundAmount: null,
  shippingFee: 5000,
  cancelFee: null,
  actualRefundAmount: 32000,
};

const meta = {
  title: "Features/Funding History/Cancel",
  component: FundingCancel,
  args: { fundingId: "in_progress", detail, refund, onSubmit: fn() },
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
    await expect(canvas.queryByText(/사진 첨부/)).not.toBeInTheDocument();
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

/** 배송 지연은 `POST /api/v2/refunds/shipping-delay`가 있어 사진 없이 바로 신청할 수 있다. */
export const ReturnVariant: Story = {
  args: { fundingId: "delivered", variant: "return" },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "펀딩 반품/교환" })).toBeVisible();
    await expect(canvas.getByText("사진 첨부 (선택)")).toBeVisible();
    await expect(canvas.getByText("배송비").nextElementSibling).toHaveTextContent("-5,000원");

    const submit = canvas.getByRole("button", { name: "반품/교환 신청" });
    await expect(submit).toBeDisabled();
    await userEvent.selectOptions(canvas.getByRole("combobox", { name: "유형" }), "반품");
    await userEvent.selectOptions(canvas.getByRole("combobox", { name: "사유" }), "배송 지연");
    await expect(submit).toBeEnabled();
    await userEvent.click(submit);

    const dialog = within(canvas.getByRole("dialog"));
    await expect(dialog.getByText("반품을 신청할까요?")).toBeVisible();
    await userEvent.click(dialog.getByRole("button", { name: "반품 신청" }));
    await expect(args.onSubmit).toHaveBeenCalled();
  },
};

/** 하자 유형은 `evidenceUrls`가 필수라 사진을 붙이기 전에는 신청할 수 없다. */
export const DefectNeedsEvidence: Story = {
  args: { fundingId: "delivered", variant: "return" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.selectOptions(canvas.getByRole("combobox", { name: "유형" }), "반품");
    await userEvent.selectOptions(canvas.getByRole("combobox", { name: "사유" }), "불량·하자");
    await expect(canvas.getByText("사진 첨부 (필수)")).toBeVisible();
    await expect(canvas.getByRole("button", { name: "반품 신청" })).toBeDisabled();
  },
};

/** 계약이 없는 조합은 원본 옵션을 남기되 제출만 막고 이유를 알린다. */
export const UnsupportedReasons: Story = {
  args: { fundingId: "delivered", variant: "return" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.selectOptions(canvas.getByRole("combobox", { name: "유형" }), "반품");
    await userEvent.selectOptions(canvas.getByRole("combobox", { name: "사유" }), "단순변심");
    await expect(canvas.getByText("단순변심 반품은 아직 제공되지 않습니다.")).toBeVisible();
    await expect(canvas.getByRole("button", { name: "반품 신청" })).toBeDisabled();

    await userEvent.selectOptions(canvas.getByRole("combobox", { name: "유형" }), "교환");
    await userEvent.selectOptions(canvas.getByRole("combobox", { name: "사유" }), "구성품 누락");
    await expect(canvas.getByText("교환 신청은 아직 제공되지 않습니다.")).toBeVisible();
    await expect(canvas.getByRole("button", { name: "교환 신청" })).toBeDisabled();
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
