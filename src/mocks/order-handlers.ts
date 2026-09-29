import { http, HttpResponse } from "msw";

import type { RefundSummary } from "@/entities/refund/api/refund-api";
import type {
  CheckoutAddress,
  CheckoutCoupon,
  OrderCancelBody,
  OrderCreated,
  OrderDetail,
  OrderRequest,
  OrderSummary,
} from "@/entities/order/api/order-api";

import {
  FIXTURE_LIMITED_REWARD_ID,
  FIXTURE_ORDER_ID,
  FIXTURE_PROJECT_ID,
  FIXTURE_REWARD_ID,
} from "./fixtures";

/* 구매 퍼널 E2E가 쿠폰 선택까지 확인할 수 있게 최소 조건 없이 항상 쓸 수 있는 쿠폰 1장을 둔다. */
const FIXTURE_COUPON_CODE = "E2E5000";
const FIXTURE_COUPON_DISCOUNT = 5_000;
const fixtureCoupon: CheckoutCoupon = {
  couponCode: FIXTURE_COUPON_CODE,
  couponName: "5,000원 할인 쿠폰",
  discountType: "FIXED",
  discountValue: FIXTURE_COUPON_DISCOUNT,
  status: "AVAILABLE",
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60_000).toISOString(),
  minFundingAmount: 0,
  perMemberLimit: 1,
  targetScope: "ALL",
  targetRefId: null,
  issuerType: "PLATFORM",
  maxDiscountAmount: FIXTURE_COUPON_DISCOUNT,
};

const fixtureAddress: CheckoutAddress = {
  id: 1,
  isDefault: true,
  recipientName: "홍길동",
  phoneNumber: "01012345678",
  zipcode: "06236",
  addressLine1: "서울시 강남구 테헤란로 1",
  addressLine2: "101동 101호",
};

/* OrderDetail에는 projectId가 없다(BE 응답에도 없음 — projectTitle만 옴). 목록(OrderSummary)엔
   있어서 toSummary가 쓸 수 있게 스토어에는 별도로 들고 있는다. */
export type OrderRecord = OrderDetail & {
  projectId: string;
  createdAt: string;
  cancelReason?: string;
  reasonDetail?: string;
  /* 반품·교환·하자 환불 신청(refund-handlers.ts). 취소는 위 cancelReason으로 따로 다룬다. */
  refundEntries?: RefundSummary[];
};

/* 취소(2번 플로우)와 환불 목록(refund-handlers.ts)이 같은 상태를 봐야 "취소 신청 → /my/refunds에
   반영"이 실제로 동작한다. 그래서 인메모리 스토어를 export해 refund-handlers.ts가 그대로 읽는다.
   ponytail: 모듈 메모리는 E2E의 하드 네비게이션(page.goto)마다 새 JS 컨텍스트로 초기화돼 사라진다 —
   같은 탭에서만 살아있으면 되므로 sessionStorage에 미러링해 하드 네비게이션을 견디게 한다. */
const STORAGE_KEY = "e2e-mock-orders";

export function persistOrdersStore() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...ordersStore]));
  } catch {
    /* 세션스토리지가 없는 환경(SSR 등)에서는 조용히 무시한다. */
  }
}

function loadOrdersStore(): Map<string, OrderRecord> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return new Map(JSON.parse(raw));
  } catch {
    /* 손상된 값은 무시하고 기본 픽스처로 되돌아간다. */
  }
  return new Map();
}

/* 저장된 키가 있으면(빈 배열 포함) 그대로 쓴다 — E2E가 "참여 내역 없음"·"배송 완료 주문"처럼
   기본 픽스처와 다른 상태를 심을 수 있어야 하기 때문이다. 키가 없는 새 탭에서만 기본 픽스처를 넣는다. */
function hasPersistedOrders() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

const seedFixture = !hasPersistedOrders();
export const ordersStore = loadOrdersStore();

if (seedFixture && ordersStore.size === 0) {
  ordersStore.set(FIXTURE_ORDER_ID, {
    orderId: FIXTURE_ORDER_ID,
    projectId: FIXTURE_PROJECT_ID,
    projectTitle: "감성 캠핑 무드등 세트",
    thumbnailUrl: null,
    status: "FUNDING_IN_PROGRESS",
    progressStage: "FUNDING_IN_PROGRESS",
    finalAmount: 39_000,
    shippingFee: 0,
    discountAmount: 0,
    shippingAddress: fixtureAddress,
    paidAt: new Date().toISOString(),
    availableActions: ["CANCEL"],
    refundRequests: [],
    lineItems: [
      {
        rewardId: FIXTURE_REWARD_ID,
        rewardName: "기본 무드등 1개",
        quantity: 1,
        unitPrice: 39_000,
        options: [],
      },
    ],
    createdAt: new Date().toISOString(),
  });
  persistOrdersStore();
}

function toSummary(record: OrderRecord): OrderSummary {
  return {
    orderId: record.orderId,
    projectId: record.projectId,
    projectTitle: record.projectTitle ?? undefined,
    status: record.status,
    progressStage: record.progressStage,
    discountAmount: record.discountAmount,
    finalAmount: record.finalAmount,
    createdAt: record.createdAt,
    paidAt: record.paidAt,
    thumbnailUrl: record.thumbnailUrl ?? undefined,
    rewardSummary:
      record.lineItems.length > 1
        ? `${record.lineItems[0].rewardName} 외 ${record.lineItems.length - 1}건`
        : (record.lineItems[0]?.rewardName ?? ""),
    totalQuantity: record.lineItems.reduce((sum, line) => sum + line.quantity, 0),
    lineItems: record.lineItems,
    availableActions: record.availableActions,
    refundRequests: record.refundRequests,
  };
}

export const orderHandlers = [
  http.get("*/api/v1/addresses", () => HttpResponse.json([fixtureAddress])),

  http.get("*/api/v1/coupons/me", () =>
    HttpResponse.json({ content: [fixtureCoupon], hasNext: false }),
  ),

  // ponytail: 프리뷰 금액은 항목 구성과 무관하게 고정값이다. 쿠폰 할인 계산도 픽스처 쿠폰
  // 코드 하나만 인식하는 고정 분기다 — 실제 할인 계산 로직은 checkout-selection.test.mjs가
  // 이미 단위 테스트로 덮는다.
  http.post("*/api/v1/orders/preview", async ({ request }) => {
    const body = (await request.json()) as OrderRequest;
    const applied = body.couponCodes.includes(FIXTURE_COUPON_CODE);
    const discountAmount = applied ? FIXTURE_COUPON_DISCOUNT : 0;
    return HttpResponse.json({
      rewardAmount: 39_000,
      shippingFee: 0,
      discountAmount,
      finalAmount: 39_000 - discountAmount,
      appliedCoupons: applied
        ? [{ couponCode: FIXTURE_COUPON_CODE, issuerType: "PLATFORM", discountType: "FIXED" }]
        : [],
    });
  }),

  http.post("*/api/v1/orders", async ({ request }) => {
    const body = (await request.json()) as OrderRequest;
    if (body.lineItems.some((line) => line.rewardId === FIXTURE_LIMITED_REWARD_ID))
      return HttpResponse.json(
        { code: "INSUFFICIENT_STOCK", message: "재고 부족" },
        { status: 409 },
      );
    const orderId = crypto.randomUUID();
    const line = body.lineItems[0];
    const discountAmount = body.couponCodes.includes(FIXTURE_COUPON_CODE)
      ? FIXTURE_COUPON_DISCOUNT
      : 0;
    const record: OrderRecord = {
      orderId,
      projectId: body.projectId,
      projectTitle:
        body.projectId === FIXTURE_PROJECT_ID ? "감성 캠핑 무드등 세트" : "체험 프로젝트",
      thumbnailUrl: null,
      status: "PENDING",
      progressStage: "FUNDING_IN_PROGRESS",
      finalAmount: 39_000 - discountAmount,
      shippingFee: 0,
      discountAmount,
      shippingAddress: body.shippingAddress,
      availableActions: ["CANCEL"],
      refundRequests: [],
      lineItems: line
        ? [
            {
              rewardId: line.rewardId,
              rewardName: line.rewardId === FIXTURE_REWARD_ID ? "기본 무드등 1개" : "리워드",
              quantity: line.quantity,
              unitPrice: 39_000,
              options: [],
            },
          ]
        : [],
      createdAt: new Date().toISOString(),
    };
    ordersStore.set(orderId, record);
    persistOrdersStore();
    const created: OrderCreated = {
      orderId,
      projectId: record.projectId,
      status: record.status,
      finalAmount: record.finalAmount,
      paymentExpiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
    };
    return HttpResponse.json(created);
  }),

  http.get("*/api/v1/orders/:id", ({ params }) => {
    const record = ordersStore.get(String(params.id));
    if (!record)
      return HttpResponse.json({ code: "NOT_FOUND", message: "주문 없음" }, { status: 404 });
    const detail: OrderDetail = {
      orderId: record.orderId,
      projectTitle: record.projectTitle,
      thumbnailUrl: record.thumbnailUrl,
      status: record.status,
      progressStage: record.progressStage,
      finalAmount: record.finalAmount,
      shippingFee: record.shippingFee,
      discountAmount: record.discountAmount,
      shippingAddress: record.shippingAddress,
      paidAt: record.paidAt,
      availableActions: record.availableActions,
      refundRequests: record.refundRequests,
      lineItems: record.lineItems,
    };
    return HttpResponse.json(detail);
  }),

  http.get("*/api/v1/orders", () => {
    const content = [...ordersStore.values()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(toSummary);
    return HttpResponse.json({ content, totalElements: content.length, hasNext: false });
  }),

  /* 결제창 진입: 실제 Toss 키가 없는 E2E에서는 호출되지 않지만, 키가 있는 개발 환경에서도 결제 흐름이
     끝까지 돌도록 둔다. pgOrderId는 `pg-<주문 UUID>`라 승인 핸들러가 주문을 되찾는다. */
  http.post("*/api/v2/payments", async ({ request }) => {
    const { fundingId } = (await request.json()) as { fundingId: string };
    const record = ordersStore.get(fundingId);
    if (!record)
      return HttpResponse.json({ code: "NOT_FOUND", message: "주문 없음" }, { status: 404 });
    return HttpResponse.json({
      paymentId: `pay-${fundingId}`,
      pgOrderId: `pg-${fundingId}`,
      amount: record.finalAmount,
      orderName: record.projectTitle ?? "펀딩 참여",
    });
  }),

  http.post("*/api/v2/payments/confirm", async ({ request }) => {
    const body = (await request.json()) as { paymentKey: string; orderId: string; amount: number };
    const record = ordersStore.get(body.orderId.replace(/^pg-/, ""));
    if (!record)
      return HttpResponse.json({ code: "NOT_FOUND", message: "주문 없음" }, { status: 404 });
    if (body.amount !== record.finalAmount)
      return HttpResponse.json(
        { code: "PAYMENT_AMOUNT_MISMATCH", message: "결제 금액 불일치" },
        { status: 400 },
      );
    record.status = "FUNDING_IN_PROGRESS";
    record.paidAt = new Date().toISOString();
    persistOrdersStore();
    return HttpResponse.json({
      paymentId: `pay-${record.orderId}`,
      fundingId: record.orderId,
      status: "COMPLETED",
      paidAt: record.paidAt,
    });
  }),

  http.post("*/api/v1/orders/:id/cancel", async ({ params, request }) => {
    const record = ordersStore.get(String(params.id));
    if (!record)
      return HttpResponse.json({ code: "NOT_FOUND", message: "주문 없음" }, { status: 404 });
    const body = (await request.json().catch(() => undefined)) as OrderCancelBody | undefined;
    record.status = "CANCELLED_BY_MEMBER";
    record.progressStage = "CANCELLED";
    record.availableActions = [];
    record.cancelReason = body?.cancelReason;
    record.reasonDetail = body?.reasonDetail;
    persistOrdersStore();
    return HttpResponse.json({ orderId: record.orderId, status: record.status });
  }),
];
