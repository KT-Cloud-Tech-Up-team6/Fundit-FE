/* 실제(UUID) 프로젝트의 리워드 조회 응답을 리워드 선택 화면 모델로 옮기고, 담은 장바구니를
   주문 줄로 바꾼다. 표시 규칙은 노션 FE 자체 판단 57~61을 따른다. */
import { queryOptions } from "@tanstack/react-query";
import {
  getPublicRewards,
  type PublicReward,
} from "../../../entities/project/api/buyer-project-api";
import type { OrderLine } from "../../../entities/order/api/order-api";
import { type Reward, type RewardCart } from "./reward-demo";

/** 프로젝트 상세와 주문서가 같은 키로 리워드 조회 캐시를 나눠 쓴다. */
export function publicRewardsQuery(projectId: string) {
  return queryOptions({
    queryKey: ["public-rewards", projectId],
    queryFn: ({ signal }) => getPublicRewards(projectId, signal),
  });
}

export function toRewards(rewards: PublicReward[]): Reward[] {
  return rewards.map((reward) => {
    const discounted = reward.isEarlyBird ? reward.earlyBirdDiscountedPrice : undefined;
    return {
      id: `reward-${reward.rewardId}`,
      rewardId: reward.rewardId,
      name: reward.name,
      price: discounted ?? reward.price,
      originalPrice:
        discounted !== undefined && discounted < reward.price ? reward.price : undefined,
      earlyBirdRate:
        reward.isEarlyBird && reward.earlyBirdDiscountType === "RATE"
          ? reward.earlyBirdDiscountValue
          : undefined,
      isEarlyBird: reward.isEarlyBird,
      isLimited: reward.isLimited,
      perks: [],
      meta: [reward.description].filter((part): part is string => Boolean(part)),
      soldOut: reward.soldOut,
      remainingStock: reward.remainingStock,
      options: reward.options.map((group) => ({
        groupName: group.groupName,
        values: group.values.map((value) => ({ label: value.value, id: value.valueId })),
      })),
    };
  });
}

/** 담은 줄을 주문서(`/funding/{id}/checkout?items=`)가 받는 주문 줄로 바꾼다. 같은 리워드라도
    옵션 조합이 다르면 줄이 따로다. */
export function toOrderLines(rewards: Reward[], cart: RewardCart): OrderLine[] {
  return Object.entries(cart).flatMap(([id, lines]) => {
    const rewardId = rewards.find((reward) => reward.id === id)?.rewardId;
    if (rewardId === undefined) return [];
    return lines.map((line) => ({
      rewardId,
      quantity: line.quantity,
      optionValueIds: line.optionValueIds ?? [],
    }));
  });
}
