import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import type { RefundEstimate } from "@/entities/refund/api/refund-request-api";
import { FundingCancel } from "./funding-cancel";

/* Figma FL_B_MY_FUND_CL(2323:53183~55363)의 상품 카드 값. */
const detail = {
  imageSrc: "/images/funding-history/collagen-cream.png",
  projectTitle: "탄탄하고 촉촉한 피부를 위한 데일리 콜라겐 크림",
  rewardOption: "콜라겐 크림 1개 + 미니 선크림 증정",
  rewardQuantity: 1,
  amount: 23000,
};

/* `GET /api/v1/refunds/estimate` 응답. 유형별 값은 BE `RefundEstimateService` 규칙을 옮겼다.
   null 필드(`refundAmount`)는 BE가 JSON에서 빼므로 키를 두지 않는다. */
const withoutRefundAmount: RefundEstimate = {
  orderId: "0198f2b1-2c3d-7a1e-9c4f-6a2b1e0d8f32",
  paymentAmount: 23000,
  rewardAmount: 23000,
  shippingFee: 0,
  discountAmount: 0,
  returnShippingFee: 0,
  additionalPaymentAmount: 0,
  confirmed: true,
};
const fullRefund = { ...withoutRefundAmount, refundAmount: 23000 };
const returnBuyerFault = { ...fullRefund, returnShippingFee: 5000, refundAmount: 18000 };
const defectCreatorFault = { ...fullRefund, confirmed: false };
const defectOther = { ...withoutRefundAmount, confirmed: false };
const exchangeBuyerFault = { ...withoutRefundAmount, additionalPaymentAmount: 5000 };
const exchangeCreatorFault = { ...withoutRefundAmount, confirmed: false };

const meta = {
  title: "Features/Funding History/Cancel",
  component: FundingCancel,
  args: {
    fundingId: "in_progress",
    detail,
    estimate: fullRefund,
    onTargetChange: fn(),
    onSubmit: fn(),
  },
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
} satisfies Meta<typeof FundingCancel>;
export default meta;

type Story = StoryObj<typeof meta>;

const amountOf = (canvas: ReturnType<typeof within>, label: string) =>
  canvas.getByText(label).nextElementSibling;

async function choose(canvas: ReturnType<typeof within>, dropdown: string, option: string) {
  await userEvent.click(canvas.getByRole("button", { name: dropdown }));
  await userEvent.click(canvas.getByRole("option", { name: option }));
}

export const Desktop: Story = { globals: { viewport: { value: "desktop" } } };

/** CL_1: 사유를 고르기 전에는 환불 정보가 없고 취소 신청이 비활성이다. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "펀딩 취소" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "취소 신청" })).toBeDisabled();
    await expect(canvas.queryByText("환불 정보")).not.toBeInTheDocument();
    await expect(canvas.queryByText(/사진 첨부/)).not.toBeInTheDocument();
  },
};

/** CL_2: 드롭다운 순서는 Figma 2323:53242 그대로다. */
export const CancelReasonOptions: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "취소 사유" }));
    const options = canvas.getAllByRole("option").map((option) => option.textContent);
    await expect(options).toEqual(["단순 변심", "결제 정보 오류", "옵션 선택 오류", "기타"]);
  },
};

/** CL_3 → CL_9: 사유를 고르면 서버 금액으로 환불 정보가 보이고, 확인 후 사유 코드를 보낸다.
    적립금 환불 금액 행은 적립금 기능이 빠져 그리지 않는다. */
export const CancelWithReason: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await choose(canvas, "취소 사유", "옵션 선택 오류");
    await userEvent.type(canvas.getByRole("textbox", { name: "상세 내용" }), "개수를 잘못");
    await expect(canvas.getByText("환불 정보")).toBeVisible();
    await expect(amountOf(canvas, "결제 금액")).toHaveTextContent("23,000원");
    await expect(amountOf(canvas, "예상 환불액")).toHaveTextContent("23,000원");
    await expect(canvas.queryByText("적립금 환불 금액")).not.toBeInTheDocument();

    await userEvent.click(canvas.getByRole("button", { name: "취소 신청" }));
    const dialog = within(canvas.getByRole("dialog"));
    await expect(dialog.getByText("펀딩을 취소할까요?")).toBeVisible();
    await expect(dialog.getByText("취소 신청 시 결제 금액이 환불됩니다")).toBeVisible();
    await userEvent.click(dialog.getByRole("button", { name: "취소 신청" }));
    await expect(args.onSubmit).toHaveBeenCalledWith({
      kind: "cancel",
      body: { cancelReason: "OPTION_SELECTION_ERROR", reasonDetail: "개수를 잘못" },
    });
  },
};

/** 기타는 상세 내용이 있어야 신청할 수 있다(BE 400). */
export const OtherRequiresDetail: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await choose(canvas, "취소 사유", "기타");
    const submit = canvas.getByRole("button", { name: "취소 신청" });
    await expect(submit).toBeDisabled();
    const textbox = canvas.getByRole("textbox", { name: "상세 내용" });
    await expect(textbox).toHaveAttribute("placeholder", "내용을 입력해주세요 (필수)");
    await userEvent.type(textbox, "   ");
    await expect(submit).toBeDisabled();
    await userEvent.type(textbox, "배송지가 바뀌었어요");
    await expect(submit).toBeEnabled();
  },
};

/** "닫기"를 누르면 모달만 닫히고 화면은 그대로 남는다. */
export const DismissConfirm: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await choose(canvas, "취소 사유", "단순 변심");
    await userEvent.click(canvas.getByRole("button", { name: "취소 신청" }));
    await userEvent.click(canvas.getByRole("button", { name: "닫기" }));
    // 네이티브 <dialog>는 close() 해도 DOM에는 남고 display:none으로만 숨는다.
    await expect(canvas.getByText("펀딩을 취소할까요?")).not.toBeVisible();
    await expect(args.onSubmit).not.toHaveBeenCalled();
  },
};

/** CL_1-1: 발송 지연 취소는 고정 사유와 환불 정보가 처음부터 보이고 바로 신청할 수 있다.
    입력란은 BE `/shipping-delay`에 필드가 없어 숨긴다(임시 처리). */
export const ShippingDelay: Story = {
  args: { variant: "shipping-delay" },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("발송 예정일 지연 취소")).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "취소 사유" })).not.toBeInTheDocument();
    await expect(canvas.queryByRole("textbox")).not.toBeInTheDocument();
    await expect(amountOf(canvas, "예상 환불액")).toHaveTextContent("23,000원");
    await userEvent.click(canvas.getByRole("button", { name: "취소 신청" }));
    await userEvent.click(
      within(canvas.getByRole("dialog")).getByRole("button", { name: "취소 신청" }),
    );
    await expect(args.onSubmit).toHaveBeenCalledWith({ kind: "shipping-delay" });
  },
};

/** 예상 금액을 받지 못하면(결제 전 주문 404 등) 환불 정보만 숨긴다. */
export const EstimateUnavailable: Story = {
  args: { variant: "shipping-delay", estimate: null },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByText("환불 정보")).not.toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "취소 신청" })).toBeEnabled();
  },
};

/** CL_4: 유형(교환/반품)을 고르기 전에는 "신청"이 비활성이고 금액 영역이 없다. */
export const ReturnDefault: Story = {
  args: { fundingId: "delivered", variant: "return", estimate: null },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "리워드 반품/교환" })).toBeVisible();
    await expect(canvas.getByText("사진 첨부 (선택)")).toBeVisible();
    await expect(canvas.getByRole("button", { name: "신청" })).toBeDisabled();
    await userEvent.click(canvas.getByRole("button", { name: "유형" }));
    const types = canvas.getAllByRole("option").map((option) => option.textContent);
    await expect(types).toEqual(["교환", "반품"]);
    await userEvent.click(canvas.getByRole("option", { name: "반품" }));
    await expect(canvas.getByRole("button", { name: "반품 신청" })).toBeDisabled();
    await expect(args.onTargetChange).toHaveBeenLastCalledWith(null);
  },
};

/** CL_6: 구매자 귀책 반품은 `/return`이고 반품 배송비를 뺀 서버 예상 환불액을 보여 준다. */
export const ReturnBuyerFault: Story = {
  args: { fundingId: "delivered", variant: "return", estimate: returnBuyerFault },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await choose(canvas, "유형", "반품");
    await choose(canvas, "사유", "단순 변심");
    await expect(args.onTargetChange).toHaveBeenLastCalledWith({
      kind: "return",
      returnReason: "CHANGE_OF_MIND",
    });
    await expect(canvas.getByText("환불 정보")).toBeVisible();
    await expect(amountOf(canvas, "결제 금액")).toHaveTextContent("23,000원");
    await expect(amountOf(canvas, "반품 배송비")).toHaveTextContent("-5,000원");
    await expect(amountOf(canvas, "예상 환불액")).toHaveTextContent("18,000원");
    await expect(canvas.getByText("사진 첨부 (선택)")).toBeVisible();

    await userEvent.click(canvas.getByRole("button", { name: "반품 신청" }));
    const dialog = within(canvas.getByRole("dialog"));
    await expect(dialog.getByText("리워드를 반품할까요?")).toBeVisible();
    await expect(dialog.getByText("신청 내용을 확인한 후 반품이 진행됩니다")).toBeVisible();
    await userEvent.click(dialog.getByRole("button", { name: "반품 신청" }));
    await expect(args.onSubmit).toHaveBeenCalledWith({
      kind: "return-request",
      target: { kind: "return", returnReason: "CHANGE_OF_MIND" },
      reasonDetail: "",
      files: [],
    });
  },
};

/** 2323:53657: 창작자 귀책 반품은 `/defect`라 BE가 증빙을 필수로 받는다. */
export const ReturnCreatorFault: Story = {
  args: { fundingId: "delivered", variant: "return", estimate: defectCreatorFault },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await choose(canvas, "유형", "반품");
    await choose(canvas, "사유", "상품이 잘못 배송됨");
    await expect(args.onTargetChange).toHaveBeenLastCalledWith({
      kind: "defect",
      defectType: "WRONG_DELIVERY",
    });
    await expect(amountOf(canvas, "반품 배송비")).toHaveTextContent("창작자 부담 예정");
    await expect(amountOf(canvas, "예상 환불액")).toHaveTextContent("23,000원");
    await expect(
      canvas.getByText(
        "상품 확인 후 확정돼요. 구매자 사유로 확인되면 반품 배송비 5,000원이 청구될 수 있어요.",
      ),
    ).toBeVisible();
    await expect(canvas.getByText("사진 첨부 (필수)")).toBeVisible();
    const submit = canvas.getByRole("button", { name: "반품 신청" });
    await expect(submit).toBeDisabled();

    const input = canvasElement.querySelector<HTMLInputElement>('input[type="file"]')!;
    await userEvent.upload(input, new File(["x"], "box.png", { type: "image/png" }));
    await expect(submit).toBeEnabled();
  },
};

/** 반품 기타는 서버가 확정액을 주지 않아 금액 대신 안내 문구를 보여 준다. */
export const ReturnOther: Story = {
  args: { fundingId: "delivered", variant: "return", estimate: defectOther },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await choose(canvas, "유형", "반품");
    await choose(canvas, "사유", "기타");
    await expect(amountOf(canvas, "반품 배송비")).toHaveTextContent("접수 후 확인하여 안내");
    await expect(amountOf(canvas, "예상 환불액")).toHaveTextContent("접수 후 확인하여 안내");
  },
};

/** 2323:53675: 구매자 귀책 교환은 교환 배송비만큼 추가 결제한다. 교환 확인 모달은 Figma에 없어
    반품과 같은 형식이다. */
export const ExchangeBuyerFault: Story = {
  args: { fundingId: "delivered", variant: "return", estimate: exchangeBuyerFault },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await choose(canvas, "유형", "교환");
    await choose(canvas, "사유", "옵션 선택 오류");
    await expect(args.onTargetChange).toHaveBeenLastCalledWith({
      kind: "exchange",
      exchangeReason: "WRONG_OPTION",
    });
    await expect(canvas.getByText("결제 정보")).toBeVisible();
    await expect(amountOf(canvas, "교환 배송비")).toHaveTextContent("5,000원");
    await expect(amountOf(canvas, "추가 결제 금액")).toHaveTextContent("5,000원");
    await userEvent.type(canvas.getByRole("textbox", { name: "상세 내용" }), " 사이즈 교환 ");

    await userEvent.click(canvas.getByRole("button", { name: "교환 신청" }));
    const dialog = within(canvas.getByRole("dialog"));
    await expect(dialog.getByText("리워드를 교환할까요?")).toBeVisible();
    await userEvent.click(dialog.getByRole("button", { name: "교환 신청" }));
    await expect(args.onSubmit).toHaveBeenCalledWith({
      kind: "return-request",
      target: { kind: "exchange", exchangeReason: "WRONG_OPTION" },
      reasonDetail: "사이즈 교환",
      files: [],
    });
  },
};

/** CL_8: 창작자 귀책 교환은 증빙이 선택이고 교환 배송비를 창작자가 부담할 예정으로 안내한다. */
export const ExchangeCreatorFault: Story = {
  args: { fundingId: "delivered", variant: "return", estimate: exchangeCreatorFault },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await choose(canvas, "유형", "교환");
    await choose(canvas, "사유", "불량·하자");
    await expect(amountOf(canvas, "교환 배송비")).toHaveTextContent("창작자 부담 예정");
    await expect(amountOf(canvas, "추가 결제 금액")).toHaveTextContent("0원");
    await expect(
      canvas.getByText(
        "상품 확인 후 확정돼요. 구매자 사유로 확인되면 교환 배송비 5,000원이 청구될 수 있어요.",
      ),
    ).toBeVisible();
    await expect(canvas.getByText("사진 첨부 (선택)")).toBeVisible();
    await expect(canvas.getByRole("button", { name: "교환 신청" })).toBeEnabled();
  },
};

/** 교환 기타는 그려진 화면이 없어 금액 행을 안내 문구로 채운다. */
export const ExchangeOther: Story = {
  args: { fundingId: "delivered", variant: "return", estimate: exchangeCreatorFault },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await choose(canvas, "유형", "교환");
    await choose(canvas, "사유", "기타");
    await expect(amountOf(canvas, "교환 배송비")).toHaveTextContent("접수 후 확인하여 안내");
    await expect(amountOf(canvas, "추가 결제 금액")).toHaveTextContent("접수 후 확인하여 안내");
  },
};

/** 서버가 거절한 이유는 CTA 위에 안내한다. */
export const SubmitError: Story = {
  args: {
    fundingId: "delivered",
    variant: "return",
    estimate: null,
    submitError: "반품·교환 가능 기간이 지났습니다.",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("alert")).toHaveTextContent("반품·교환 가능 기간이 지났습니다.");
  },
};
