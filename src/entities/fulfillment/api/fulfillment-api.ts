import { apiRequest } from "../../../shared/api/client";

export const stages = [
  "PRODUCTION_START",
  "MANUFACTURING",
  "INSPECTION",
  "SHIPPING_OUT",
  "DELIVERY",
] as const;
export type Stage = (typeof stages)[number];
export const stageNames: Record<Stage, string> = {
  PRODUCTION_START: "제작 착수",
  MANUFACTURING: "생산",
  INSPECTION: "검수",
  SHIPPING_OUT: "출고",
  DELIVERY: "배송",
};
export const reasons = {
  START_DELAY: "착수 지연",
  STOCK_SHORTAGE: "재고 부족",
  INSPECTION_DELAY: "검수 지연",
  SHIPPING_DELAY: "출고 지연",
  OTHER: "기타",
};
export type ScheduleChange = {
  scheduleChangeId: number;
  stage: Stage;
  reasonType: keyof typeof reasons;
  reasonDetail?: string;
  oldPlannedDate?: string;
  newPlannedDate: string;
  changedAt: string;
};
export type Fulfillment = {
  projectId: string;
  currentStage: Stage;
  lastUpdatedAt?: string;
  isUpdateOverdue: boolean;
  stages: {
    stage: Stage;
    status: "COMPLETED" | "IN_PROGRESS" | "NOT_STARTED";
    plannedStartAt?: string;
    plannedEndAt?: string;
    detailText?: string;
    updatedAt?: string;
  }[];
  scheduleChanges: ScheduleChange[];
};
export type Shipment = {
  fundingId: string;
  status: string;
  carrier?: string;
  trackingNumber?: string;
  shippedAt?: string;
  deliveredAt?: string;
  receiptConfirmedAt?: string;
  canConfirmReceipt: boolean;
};
export function getFulfillment(projectId: string, signal?: AbortSignal) {
  return apiRequest<Fulfillment>(`/api/v2/projects/${projectId}/fulfillment`, { signal });
}
export function getOwnedProject(projectId: string, signal?: AbortSignal) {
  return apiRequest<{ projectId: string; title: string }>(`/api/v1/projects/${projectId}/preview`, {
    auth: true,
    signal,
  });
}
export function transitionStage(projectId: string, stage: Stage) {
  return apiRequest(`/api/v2/projects/${projectId}/fulfillment/stage`, {
    auth: true,
    method: "PATCH",
    body: { stage },
  });
}
export function saveStageDetail(
  projectId: string,
  body: { stage: Stage; detailText: string; plannedStartAt?: string; plannedEndAt?: string },
) {
  return apiRequest(`/api/v2/projects/${projectId}/fulfillment/stage-details`, {
    auth: true,
    method: "POST",
    body,
  });
}
export function changeSchedule(
  projectId: string,
  body: {
    stage: Stage;
    reasonType: keyof typeof reasons;
    reasonDetail: string;
    newPlannedDate: string;
  },
) {
  return apiRequest<ScheduleChange>(`/api/v2/projects/${projectId}/fulfillment/schedule-changes`, {
    auth: true,
    method: "POST",
    body,
  });
}
export function getShipment(projectId: string, fundingId: string, signal?: AbortSignal) {
  return apiRequest<Shipment>(`/api/v2/projects/${projectId}/fundings/${fundingId}/shipment`, {
    auth: true,
    signal,
  });
}
export function registerShipment(
  projectId: string,
  fundingId: string,
  body: { carrier: string; trackingNumber: string },
) {
  return apiRequest<Shipment>(`/api/v2/projects/${projectId}/fundings/${fundingId}/shipment`, {
    auth: true,
    method: "POST",
    body,
  });
}
export function confirmReceipt(projectId: string, fundingId: string) {
  return apiRequest<Shipment>(
    `/api/v2/projects/${projectId}/fundings/${fundingId}/shipment/confirm-receipt`,
    { auth: true, method: "POST" },
  );
}
export async function findFundingProject(fundingId: string, signal?: AbortSignal) {
  let page = 0;
  while (true) {
    const result = await apiRequest<{
      content: { orderId: string; projectId: string; projectTitle: string }[];
      hasNext: boolean;
    }>(`/api/v1/orders?page=${page}&size=100`, { auth: true, signal });
    const order = result.content.find((item) => item.orderId === fundingId);
    if (order) return order;
    if (!result.hasNext) throw new Error("참여 내역에서 해당 주문을 찾을 수 없습니다.");
    page++;
  }
}
