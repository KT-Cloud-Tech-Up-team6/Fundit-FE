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
};

export function getSellerOrders(projectId: string, signal?: AbortSignal) {
  return apiRequest<SellerOrder[]>(`/api/v1/projects/${projectId}/orders`, { auth: true, signal });
}
