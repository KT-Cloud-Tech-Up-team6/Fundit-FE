import { saveReward, type RewardRequest } from "@/entities/project/api/reward-api";
import { ApiError } from "@/shared/api/api-error";

export class RewardCreationUncertainError extends Error {
  constructor() {
    super(
      "리워드 생성 결과를 확인하지 못해 추가 생성을 중단했습니다. 리워드 목록을 새로고침하여 생성 여부를 확인해주세요.",
    );
  }
}

export async function createRewardOnce(
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem">,
  memberId: string,
  projectId: string,
  body: RewardRequest,
) {
  const key = `fundit-reward-attempt:${memberId}:${projectId}`;
  if (storage.getItem(key)) throw new RewardCreationUncertainError();
  storage.setItem(key, "pending");
  try {
    const reward = await saveReward(projectId, body);
    if (!Number.isSafeInteger(reward?.rewardId) || reward.rewardId <= 0)
      throw new RewardCreationUncertainError();
    storage.removeItem(key);
    return reward;
  } catch (error) {
    if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
      storage.removeItem(key);
      throw error;
    }
    throw new RewardCreationUncertainError();
  }
}
