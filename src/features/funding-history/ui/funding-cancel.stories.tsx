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

/** `GET /api/v1/refunds/estimate` 응답을 옮긴 값. 적립금·배송비는 계약이 없어 비어 있다. */
const refund = {
  pointRefundAmount: null,
  shippingFee: null,
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
    /* 환불 정책 V.1.0 PD 확인 요청 2로 취소 수수료 행을 뺐다. */
    await expect(canvas.queryByText("취소 수수료")).not.toBeInTheDocument();
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
    await expect(canvas.getByText("배송비")).toBeVisible();
    /* 반품비 차감 계약이 없어 값은 비어 있다. estimate.shippingFee는 환불액에 포함된 금액이다. */
    await expect(canvas.getByText("배송비").nextElementSibling).not.toHaveTextContent("5,000");

    const submit = canvas.getByRole("button", { name: "반품/교환 신청" });
    await expect(submit).toBeDisabled();
    await userEvent.selectOptions(canvas.getByRole("combobox", { name: "유형" }), "반품");
    await userEvent.selectOptions(canvas.getByRole("combobox", { name: "사유" }), "배송 지연");
    await expect(
      canvas.getByText("배송 지연 접수에는 사진과 상세 내용이 함께 전달되지 않습니다."),
    ).toBeVisible();
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

/** 단순변심 반품은 받을 계약이 없어 이유를 보여 주고 막는다. 교환은 증빙이 필수라 사진 전에는 막힌다. */
export const SimpleChangeOfMindBlockedAndExchange: Story = {
  args: { fundingId: "delivered", variant: "return" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.selectOptions(canvas.getByRole("combobox", { name: "유형" }), "반품");
    await userEvent.selectOptions(canvas.getByRole("combobox", { name: "사유" }), "단순변심");
    await expect(canvas.getByText('"단순변심" 사유는 아직 접수할 수 없습니다.')).toBeVisible();
    await expect(canvas.getByRole("button", { name: "반품 신청" })).toBeDisabled();

    await userEvent.selectOptions(canvas.getByRole("combobox", { name: "유형" }), "교환");
    await userEvent.selectOptions(canvas.getByRole("combobox", { name: "사유" }), "구성품 누락");
    await expect(canvas.getByText("사진 첨부 (필수)")).toBeVisible();
    await expect(canvas.getByRole("button", { name: "교환 신청" })).toBeDisabled();
  },
};

/** 사유가 기타면 비용이 확인 후 정해져 금액 대신 안내 문구를 보여 준다(환불 정책 V.1.0 PD 확인 요청 3). */
export const OtherReasonAmountUndetermined: Story = {
  args: { fundingId: "delivered", variant: "return" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const amount = canvas.getByText("실 환불 금액").nextElementSibling;
    await userEvent.selectOptions(canvas.getByRole("combobox", { name: "유형" }), "반품");
    await userEvent.selectOptions(canvas.getByRole("combobox", { name: "사유" }), "기타");
    await expect(amount).toHaveTextContent("접수 후 확인하여 안내");

    await userEvent.selectOptions(canvas.getByRole("combobox", { name: "사유" }), "불량·하자");
    await expect(amount).toHaveTextContent("32,000원");
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
