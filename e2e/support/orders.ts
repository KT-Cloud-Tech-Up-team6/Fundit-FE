import type { Page } from "@playwright/test";
import {
  FIXTURE_DELIVERED_ORDER_ID,
  FIXTURE_PROJECT_ID,
  FIXTURE_SELLER_ORDER_IDS,
  FIXTURE_SELLER_PROJECT_ID,
} from "../../src/mocks/fixtures";

/* MSW 주문 스토어(src/mocks/order-handlers.ts)는 sessionStorage에 미러링된다. 앱이 뜨기 전에 그 키를
   심어 스펙이 필요한 주문 상태(없음·배송 완료 등)로 시작한다. 이미 값이 있으면 덮지 않아 페이지를
   다시 열어도 스펙 중 바뀐 상태가 유지된다. */
const STORAGE_KEY = "e2e-mock-orders";

type SeedOrder = { orderId: string } & Record<string, unknown>;

export async function seedOrders(page: Page, orders: SeedOrder[]) {
  const value = JSON.stringify(orders.map((order) => [order.orderId, order]));
  await page.addInitScript(
    ([key, seed]) => {
      try {
        if (sessionStorage.getItem(key) === null) sessionStorage.setItem(key, seed);
      } catch {
        /* 저장소를 못 쓰면 기본 픽스처로 시작한다. */
      }
    },
    [STORAGE_KEY, value] as const,
  );
}

export const DELIVERED_ORDER_TITLE = "휴대용 미니 블렌더";

function baseOrder(overrides: Record<string, unknown> & { orderId: string }): SeedOrder {
  const paidAt = new Date(Date.now() - 3 * 24 * 60 * 60_000).toISOString();
  return {
    projectId: FIXTURE_PROJECT_ID,
    thumbnailUrl: null,
    finalAmount: 29_000,
    shippingFee: 0,
    discountAmount: 0,
    shippingAddress: {
      recipientName: "홍길동",
      phoneNumber: "01012345678",
      zipcode: "06236",
      addressLine1: "서울시 강남구 테헤란로 1",
      addressLine2: "101동 101호",
    },
    paidAt,
    refundRequests: [],
    lineItems: [
      { rewardId: 9002, rewardName: "블렌더 본체", quantity: 1, unitPrice: 29_000, options: [] },
    ],
    createdAt: paidAt,
    ...overrides,
  };
}

/** 배송 완료(반품·교환 신청 가능) 주문 한 건. */
export function deliveredOrder(): SeedOrder {
  return baseOrder({
    orderId: FIXTURE_DELIVERED_ORDER_ID,
    projectTitle: DELIVERED_ORDER_TITLE,
    status: "DELIVERED",
    progressStage: "DELIVERED",
    availableActions: ["RETURN_REQUEST", "EXCHANGE_REQUEST"],
  });
}

export const FULFILLMENT_ORDER_ID = FIXTURE_SELLER_ORDER_IDS[0];

/** 판매자 제작·배송 목업(fulfillment-handlers.ts)과 같은 프로젝트·주문에 묶인 펀딩 성립 주문. */
export function fundedOrder(): SeedOrder {
  return baseOrder({
    orderId: FULFILLMENT_ORDER_ID,
    projectId: FIXTURE_SELLER_PROJECT_ID,
    projectTitle: "E2E 제작·배송 프로젝트",
    status: "FUNDING_SUCCEEDED",
    progressStage: "FUNDING_SUCCEEDED",
    availableActions: [],
  });
}
