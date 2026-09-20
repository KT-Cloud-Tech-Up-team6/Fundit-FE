import type { RewardRequest, RewardResponse } from "@/entities/project/api/reward-api";
import type { DemoReward, RewardDraft } from "./basic-info-demo";

export function rewardToDraft(reward: RewardResponse): DemoReward {
  return {
    id: reward.rewardId,
    name: reward.name,
    description: reward.description,
    price: String(reward.price),
    limited: reward.isLimited,
    quantity: reward.quantity === null ? "" : String(reward.quantity),
    discount: reward.isEarlyBird,
    discountUnit: reward.earlyBirdDiscountType === "RATE" ? "percent" : "won",
    discountValue:
      reward.earlyBirdDiscountValue === null ? "" : String(reward.earlyBirdDiscountValue),
    imageName: reward.imageUrl ?? "",
    options: reward.hasOption,
  };
}

export function rewardRequest(draft: RewardDraft, imageUrl?: string): RewardRequest {
  return {
    name: draft.name.trim(),
    description: draft.description.trim(),
    ...(imageUrl ? { imageUrl } : {}),
    price: Number(draft.price),
    isLimited: draft.limited,
    quantity: draft.limited ? Number(draft.quantity) : null,
    isEarlyBird: draft.discount,
    earlyBirdDiscountType: draft.discount
      ? draft.discountUnit === "percent"
        ? "RATE"
        : "AMOUNT"
      : null,
    earlyBirdDiscountValue: draft.discount ? Number(draft.discountValue) : null,
  };
}
