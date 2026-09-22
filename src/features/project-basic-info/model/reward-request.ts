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
    optionGroups: (reward.options ?? []).map((group) => ({
      optionGroupId: group.groupId,
      groupName: group.groupName,
      values: group.values.map((value) => value.value),
    })),
    optionSummary: (reward.options ?? [])
      .map((group) => `${group.groupName}: ${group.values.map((value) => value.value).join(", ")}`)
      .join(" / "),
    simpleRefundDisabled: reward.simpleRefundDisabled,
  };
}

export function rewardOptionsError(draft: RewardDraft) {
  if (!draft.options) return "";
  if (!draft.optionGroups?.length) return "옵션 그룹을 하나 이상 추가해주세요.";
  if (draft.optionGroups.some((group) => !group.groupName.trim()))
    return "옵션 그룹명을 입력해주세요.";
  if (
    draft.optionGroups.some(
      (group) => !group.values.length || group.values.some((value) => !value.trim()),
    )
  )
    return "각 옵션 그룹에 비어 있지 않은 값을 하나 이상 입력해주세요.";
  return "";
}

export function rewardRequest(
  draft: RewardDraft,
  imageUrl?: string,
  optionsChanged = false,
): RewardRequest {
  return {
    name: draft.name.trim(),
    description: draft.description.trim(),
    ...(imageUrl ? { imageUrl } : {}),
    ...(optionsChanged
      ? {
          options: draft.options
            ? (draft.optionGroups ?? []).map((group) => ({
                ...(group.optionGroupId === undefined
                  ? {}
                  : { optionGroupId: group.optionGroupId }),
                groupName: group.groupName.trim(),
                values: group.values.map((value) => value.trim()),
              }))
            : [],
        }
      : {}),
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
