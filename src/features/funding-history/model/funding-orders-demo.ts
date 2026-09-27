/* 데모 id 경로(`/my/fundings/in_progress` 등)와 Storybook용 주문 응답 예시.
   실주문 화면은 이 값을 쓰지 않는다. 상품 문구·이미지는 Figma 목록(FUND_1) 카드를 옮긴 목업이다. */
import type { OrderDetail, OrderSummary } from "../../../entities/order/api/order-api";
import { demoFundingDetail, type FundingHistoryStatus } from "./funding-history";

const demoStages: Record<
  FundingHistoryStatus,
  Pick<OrderSummary, "status" | "progressStage" | "availableActions">
> = {
  in_progress: {
    status: "FUNDING_IN_PROGRESS",
    progressStage: "FUNDING_IN_PROGRESS",
    availableActions: ["CANCEL"],
  },
  completed: { status: "GOAL_ACHIEVED", progressStage: "FUNDING_SUCCEEDED", availableActions: [] },
  production: { status: "GOAL_ACHIEVED", progressStage: "FUNDING_SUCCEEDED", availableActions: [] },
  shipping: { status: "GOAL_ACHIEVED", progressStage: "SHIPPING", availableActions: [] },
  delivered: {
    status: "GOAL_ACHIEVED",
    progressStage: "DELIVERED",
    availableActions: ["RETURN_REQUEST", "EXCHANGE_REQUEST", "DEFECT_REFUND_REQUEST"],
  },
};

/** 데모 상세의 id가 상태 키라 모르는 id는 진행 중으로 본다(`demoFundingDetail`과 같다). */
export function demoOrderSummary(
  fundingId: string,
  overrides: Partial<OrderSummary> = {},
): OrderSummary {
  const demo = demoFundingDetail(fundingId);
  return {
    orderId: fundingId,
    projectId: "0198f2b1-2c3d-7a1e-9c4f-6a2b1e0d8f31",
    projectTitle: demo.projectTitle,
    ...demoStages[demo.status],
    discountAmount: 0,
    finalAmount: demo.amount,
    createdAt: `${demo.paidAt}T01:00:00Z`,
    paidAt: `${demo.paidAt}T01:00:00Z`,
    sellerDisplayName: demo.creatorName,
    thumbnailUrl: demo.imageSrc,
    rewardSummary: demo.rewardOption,
    totalQuantity: demo.rewardQuantity,
    lineItems: [
      {
        rewardId: 1,
        rewardName: demo.rewardOption,
        quantity: demo.rewardQuantity,
        unitPrice: demo.amount,
        options: [],
      },
    ],
    refundRequests: [],
    ...overrides,
  };
}

/** Figma FUND_1의 카드 네 장(진행 중·성공·배송 중·배송 완료)이다. */
export function demoOrderSummaries(): OrderSummary[] {
  return ["in_progress", "completed", "shipping", "delivered"].map((id) => demoOrderSummary(id));
}

export function demoOrderDetail(fundingId: string): OrderDetail {
  const summary = demoOrderSummary(fundingId);
  return {
    orderId: summary.orderId,
    projectTitle: summary.projectTitle ?? null,
    thumbnailUrl: summary.thumbnailUrl ?? null,
    status: summary.status,
    progressStage: summary.progressStage,
    finalAmount: summary.finalAmount,
    shippingFee: 0,
    discountAmount: 0,
    shippingAddress: {
      recipientName: "홍길동",
      phoneNumber: "01000000000",
      zipcode: "06236",
      addressLine1: "서울특별시 강남구 테헤란로 1",
      addressLine2: "101호",
    },
    paidAt: summary.paidAt,
    availableActions: summary.availableActions,
    refundRequests: summary.refundRequests,
    lineItems: summary.lineItems,
  };
}
