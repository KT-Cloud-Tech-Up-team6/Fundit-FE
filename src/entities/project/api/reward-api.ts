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
};

export type RewardRequest = {
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

export function saveReward(projectId: string, body: RewardRequest, rewardId?: number) {
  return apiRequest<RewardResponse>(
    rewardId === undefined
      ? `/api/v1/projects/${projectId}/rewards`
      : `/api/v1/rewards/${rewardId}`,
    {
      auth: true,
      method: rewardId === undefined ? "POST" : "PATCH",
      body,
    },
  );
}

export function deleteReward(rewardId: number) {
  return apiRequest<void>(`/api/v1/rewards/${rewardId}`, { auth: true, method: "DELETE" });
}
