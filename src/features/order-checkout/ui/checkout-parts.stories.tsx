import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { toRewards } from "@/features/reward-selection/model/public-reward";
import { checkoutLineItems, listPriceTotal } from "../model/checkout-lines";
import { previewSummaryRows } from "../model/payment-summary";
import { CheckoutLayout, PaymentSummarySection, ProjectOrderItems } from "./checkout-parts";
import { ShippingAddressSection } from "./shipping-address-section";

/* 실제(UUID) 주문서(OrderCheckoutApi)가 조회 응답으로 그리는 모습. 컨테이너는 인증·API 조회가
   필요해 여기서는 같은 화면 조각에 같은 변환(toRewards·checkoutLineItems·previewSummaryRows)을
   거친 응답 모양 값을 넣는다. 흐름 검증은 운영 빌드의 Playwright가 맡는다. */
const rewards = toRewards([
  {
    rewardId: 11,
    rewardDisplayCode: "R-11",
    name: "얼리버드 컬러 세트",
    description: "본체 · 브러시 2종",
    price: 200_000,
    isEarlyBird: true,
    earlyBirdDiscountType: "RATE",
    earlyBirdDiscountValue: 10,
    earlyBirdDiscountedPrice: 180_000,
    isLimited: true,
    remainingStock: 3,
    options: [
      {
        groupId: 1,
        groupName: "색상",
        values: [
          { valueId: 101, value: "블랙" },
          { valueId: 102, value: "화이트" },
        ],
      },
      {
        groupId: 2,
        groupName: "사이즈",
        values: [
          { valueId: 201, value: "S" },
          { valueId: 202, value: "L" },
        ],
      },
    ],
    soldOut: false,
  },
  {
    rewardId: 12,
    rewardDisplayCode: "R-12",
    name: "정액 할인 기본 세트",
    description: "본체 · 충전 어댑터",
    price: 150_000,
    isEarlyBird: true,
    earlyBirdDiscountType: "AMOUNT",
    earlyBirdDiscountValue: 20_000,
    earlyBirdDiscountedPrice: 130_000,
    isLimited: false,
    options: [],
    soldOut: false,
  },
]);
const items = checkoutLineItems(
  [
    { rewardId: 11, quantity: 1, optionValueIds: [101, 202] },
    { rewardId: 11, quantity: 2, optionValueIds: [102, 201] },
    { rewardId: 12, quantity: 1, optionValueIds: [] },
  ],
  rewards,
);
/* BE #181 미리보기는 얼리 버드 할인가로 계산한다(180,000 + 360,000 + 130,000). 정가 합계는 750,000원이다. */
const rows = previewSummaryRows(
  {
    rewardAmount: 670_000,
    shippingFee: 3_000,
    discountAmount: 10_000,
    finalAmount: 663_000,
  },
  listPriceTotal(items),
);

function RealCheckout({ onPay }: { onPay: () => void }) {
  return (
    <CheckoutLayout
      summary={<PaymentSummarySection rows={rows} />}
      notice={
        <p className="text-caption-s text-text-secondary text-center">
          결제 수단은 다음 화면에서 선택합니다.
        </p>
      }
      ctaLabel="663,000원 결제"
      onPay={onPay}
    >
      <ShippingAddressSection
        state="saved"
        address={{
          recipientName: "큐에이",
          phone: "01000000000",
          zipCode: "06236",
          baseAddress: "서울 강남구 테헤란로 1",
          detailAddress: "101호",
        }}
      />
      <section
        aria-label="주문 상품"
        className="bg-layer-surface-default flex flex-col gap-3 px-5 py-4"
      >
        <ProjectOrderItems
          title="QA 무선청소기 프로젝트"
          image="/images/checkout/product.png"
          items={items}
        />
      </section>
    </CheckoutLayout>
  );
}

const meta = {
  title: "Features/Order Checkout/Real Checkout",
  component: RealCheckout,
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
  args: { onPay: fn() },
} satisfies Meta<typeof RealCheckout>;

export default meta;

type Story = StoryObj<typeof meta>;

const play: Story["play"] = async ({ canvasElement, args }) => {
  const canvas = within(canvasElement);
  const products = within(canvas.getByRole("region", { name: "주문 상품" }));
  await expect(
    products.getAllByRole("listitem").map((item) => item.firstElementChild?.textContent),
  ).toEqual([
    "얼리버드 컬러 세트 · 블랙 / L · 1개",
    "얼리버드 컬러 세트 · 화이트 / S · 2개",
    "정액 할인 기본 세트 · 1개",
  ]);
  /* 줄 금액은 청구 단가(얼리 버드 할인가) × 수량이고 정가는 취소선이다(Figma price_information). */
  await expect(products.getAllByText("얼리버드 할인")).toHaveLength(3);
  await expect(products.queryAllByText("상품 금액")).toHaveLength(0);
  await expect(products.getByText("400,000원")).toHaveClass("line-through");
  await expect(products.getByText("360,000원")).toBeVisible();

  /* 결제 금액은 모바일·데스크톱 두 벌이 DOM에 있어 보이는 쪽으로 좁힌다. */
  const summary = within(canvas.getByRole("region", { name: "결제 금액" }));
  await expect(summary.getAllByRole("term").map((term) => term.textContent)).toEqual([
    "총 주문 금액",
    "ㄴ펀딩 금액",
    "ㄴ배송비",
    "총 할인 금액",
    "ㄴ얼리버드 할인",
    "ㄴ쿠폰 사용",
  ]);
  /* 펀딩 금액은 정가 합계, 얼리버드 할인은 BE 금액과의 차액이다. */
  await expect(summary.getByText("ㄴ펀딩 금액").nextElementSibling).toHaveTextContent("750,000원");
  await expect(summary.getByText("ㄴ얼리버드 할인").nextElementSibling).toHaveTextContent(
    "-80,000원",
  );
  await expect(summary.getByText("총 할인 금액").nextElementSibling).toHaveTextContent("-90,000원");
  await expect(summary.getByText("최종 결제 금액").nextElementSibling).toHaveTextContent(
    "663,000원",
  );
  await expect(canvas.queryByText("적립금 사용")).toBeNull();
  await expect(canvas.queryByRole("heading", { name: "결제 수단" })).toBeNull();

  await userEvent.click(canvas.getByRole("button", { name: "663,000원 결제" }));
  await expect(args.onPay).toHaveBeenCalledTimes(1);
};

/** 모바일(390): 결제 금액은 본문 끝, 결제 버튼은 하단 고정. */
export const Mobile: Story = { globals: { viewport: { value: "figma390" } }, play };

/** 데스크톱(1440): 결제 금액과 결제 버튼은 오른쪽 sticky 상자. */
export const Desktop: Story = { globals: { viewport: { value: "desktop" } }, play };
