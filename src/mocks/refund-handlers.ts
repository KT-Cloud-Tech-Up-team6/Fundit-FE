import { http, HttpResponse } from "msw";

import type { RefundSummary } from "@/entities/refund/api/refund-api";

import { ordersStore, persistOrdersStore } from "./order-handlers";

/* /api/v2/refunds는 order-handlers.ts와 같은 인메모리 스토어를 읽는다 — 취소 신청
   (POST /api/v1/orders/{id}/cancel)이 여기 반영돼야 "취소 → /my/refunds에 뜬다"가 실제로 동작한다. */
function allRefunds(): RefundSummary[] {
  return [
    ...cancelledRefunds(),
    ...[...ordersStore.values()].flatMap((o) => o.refundEntries ?? []),
  ];
}

function cancelledRefunds(): RefundSummary[] {
  return [...ordersStore.values()]
    .filter((order) => order.status === "CANCELLED_BY_MEMBER")
    .map((order, index) => ({
      refundId: index + 1,
      fundingId: order.orderId,
      // 유형(트리거)은 사유와 별개다. 참여 취소 사유(단순 변심·옵션 선택 오류 등)는 reasonType으로 보낸다.
      triggerType: "SIMPLE_CHANGE_OF_MIND",
      reasonType: order.cancelReason,
      status: "REQUESTED",
      amount: order.finalAmount,
      requestedAt: order.createdAt,
      reasonDetail: order.reasonDetail,
      projectTitle: order.projectTitle ?? undefined,
      lineItems: order.lineItems.map((line) => ({
        rewardName: line.rewardName,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        options: line.options,
      })),
    }));
}

/* 반품·교환·하자 환불 신청. 판매자 승인 대기(REQUESTED)로만 접수되고, 주문에는 신청 이력만 남는다. */
function requestRefund(triggerType: string) {
  return async ({ request }: { request: Request }) => {
    const body = (await request.json()) as {
      fundingId: string;
      reasonDetail?: string;
      returnReason?: string;
      exchangeReason?: string;
      defectType?: string;
    };
    const order = ordersStore.get(body.fundingId);
    if (!order)
      return HttpResponse.json({ code: "NOT_FOUND", message: "주문 없음" }, { status: 404 });
    if (order.refundEntries?.length)
      return HttpResponse.json(
        { code: "REFUND_ALREADY_REQUESTED", message: "이미 접수됨" },
        { status: 409 },
      );
    const refundId = 100 + [...ordersStore.values()].flatMap((o) => o.refundEntries ?? []).length;
    const requestedAt = new Date().toISOString();
    order.refundEntries = [
      {
        refundId,
        fundingId: order.orderId,
        triggerType,
        status: "REQUESTED",
        amount: order.finalAmount,
        requestedAt,
        reasonType: body.returnReason ?? body.exchangeReason ?? body.defectType,
        reasonDetail: body.reasonDetail,
        projectTitle: order.projectTitle ?? undefined,
        lineItems: order.lineItems.map((line) => ({
          rewardName: line.rewardName,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          options: line.options,
        })),
      },
    ];
    order.refundRequests = [{ refundId, triggerType, status: "REQUESTED", requestedAt }];
    order.availableActions = [];
    persistOrdersStore();
    return HttpResponse.json({
      refundId,
      status: "REQUESTED",
      paymentAmount: order.finalAmount,
      returnShippingFee: 5_000,
      estimatedRefundAmount: order.finalAmount - 5_000,
      exchangeShippingFee: 5_000,
      additionalPaymentAmount: 0,
    });
  };
}

export const refundHandlers = [
  http.post("*/api/v2/refunds/return", requestRefund("RETURN_CHANGE_OF_MIND")),
  http.post("*/api/v2/refunds/exchange", requestRefund("EXCHANGE")),
  http.post("*/api/v2/refunds/defect", requestRefund("DEFECT")),

  http.get("*/api/v1/refunds/estimate", ({ request }) => {
    const orderId = new URL(request.url).searchParams.get("orderId") ?? "";
    const order = ordersStore.get(orderId);
    if (!order)
      return HttpResponse.json({ code: "NOT_FOUND", message: "주문 없음" }, { status: 404 });
    return HttpResponse.json({
      orderId,
      paymentAmount: order.finalAmount,
      rewardAmount: order.finalAmount,
      shippingFee: 0,
      discountAmount: 0,
      returnShippingFee: 0,
      additionalPaymentAmount: 0,
      refundAmount: order.finalAmount,
      confirmed: true,
    });
  }),

  http.get("*/api/v2/refunds", ({ request }) => {
    const params = new URL(request.url).searchParams;
    const inProgress = params.get("inProgress") === "true";
    const triggerTypes = params.getAll("triggerType");
    let content = allRefunds();
    if (inProgress) content = content.filter((refund) => refund.status !== "COMPLETED");
    if (triggerTypes.length > 0)
      content = content.filter((refund) => triggerTypes.includes(refund.triggerType));
    return HttpResponse.json({
      content,
      page: 0,
      size: 20,
      totalElements: content.length,
      totalPages: 1,
      hasNext: false,
    });
  }),
];
