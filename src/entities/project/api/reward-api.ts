import { apiRequest } from "../../../shared/api/client";

export type RewardResponse = {
  rewardId: number;
  rewardDisplayCode: string;
  name: string;
  description: string;
  imageUrl: string | null;
  price: number;
  isLimited: boolean;
  quantity: number | null;
  hasOption: boolean;
  sortOrder: number;
  isEarlyBird: boolean;
  earlyBirdDiscountType: "AMOUNT" | "RATE" | null;
  earlyBirdDiscountValue: number | null;
  earlyBirdDiscountedPrice: number | null;
  shippingFee: number | null;
  estimatedDeliveryDays: number | null;
  simpleRefundDisabled: boolean;
  options: {
    groupId: number;
    groupName: string;
    values: { valueId: number | null; value: string }[];
  }[];
};

export type RewardRequest = {
  options?: { optionGroupId?: number; groupName: string; values: string[] }[];
  name: string;
  description: string;
  imageUrl?: string;
  price: number;
  isLimited: boolean;
  quantity: number | null;
  isEarlyBird: boolean;
  earlyBirdDiscountType: "AMOUNT" | "RATE" | null;
  earlyBirdDiscountValue: number | null;
};

export function getSellerRewards(projectId: string, signal?: AbortSignal) {
  return apiRequest<RewardResponse[]>(`/api/v1/projects/${projectId}/rewards/mine`, {
    auth: true,
    signal,
  });
}

/* 같은 키·같은 본문은 새 리워드 없이 기존 리워드를 200으로 돌려준다. 같은 키에 다른 본문이 오거나
   같은 키 요청이 처리 중이면 409 CONFLICT다(BE #145). 키는 100자 이하, 유효기간 없이 리워드에 저장된다. */
export function createReward(projectId: string, body: RewardRequest, idempotencyKey: string) {
  return apiRequest<RewardResponse>(`/api/v1/projects/${projectId}/rewards`, {
    auth: true,
    method: "POST",
    body,
    headers: { "Idempotency-Key": idempotencyKey },
  });
}

export function updateReward(rewardId: number, body: RewardRequest) {
  return apiRequest<RewardResponse>(`/api/v1/rewards/${rewardId}`, {
    auth: true,
    method: "PATCH",
    body,
  });
}

export function deleteReward(rewardId: number) {
  return apiRequest<void>(`/api/v1/rewards/${rewardId}`, { auth: true, method: "DELETE" });
}
