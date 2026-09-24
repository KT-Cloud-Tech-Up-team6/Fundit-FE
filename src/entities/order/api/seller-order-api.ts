import { apiRequest } from "../../../shared/api/client";
import type { OrderAddress } from "./order-api";

export type SellerOrder = {
  orderId: string;
  lineItems: {
    rewardId: number;
    rewardName: string;
    quantity: number;
    unitPrice: number;
    options: { optionValueId: number; optionGroupName: string; optionValue: string }[];
  }[];
  shippingAddress: OrderAddress;
  /** 발송일. 발송 전이면 없다. 탭 필터·건수와 같은 값이다(BE PR #148). */
  shippedAt?: string;
};

/** BE `ShippingFilter`. WAITING은 발송일이 없는 주문, SHIPPED는 발송일이 있는 주문이다. */
export type SellerShippingFilter = "ALL" | "WAITING" | "SHIPPED";

export type SellerOrderPage = {
  content: SellerOrder[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
};

/** 목표 달성 주문을 최신순으로 받는다(BE #130). `q`는 수령인 이름·주문번호 부분 일치이고 page는 0부터 센다. */
export function getSellerOrders(
  projectId: string,
  { q, shippingFilter, page }: { q: string; shippingFilter: SellerShippingFilter; page: number },
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({ shippingFilter, page: String(page), size: "20" });
  if (q) params.set("q", q);
  return apiRequest<SellerOrderPage>(`/api/v1/projects/${projectId}/orders?${params}`, {
    auth: true,
    signal,
  });
}

/** 탭 건수. 검색어와 무관하게 목록과 같은 목표 달성 주문을 센다. */
export function getSellerOrderShippingCounts(projectId: string, signal?: AbortSignal) {
  return apiRequest<{ waiting: number; shipped: number }>(
    `/api/v1/projects/${projectId}/orders/shipping-status-counts`,
    { auth: true, signal },
  );
}
