import {
  createReward,
  type RewardRequest,
  type RewardResponse,
} from "@/entities/project/api/reward-api";
import { ApiError } from "@/shared/api/api-error";

export class RewardCreationUncertainError extends Error {
  constructor() {
    super("리워드 생성 결과를 확인하지 못했습니다. 다시 저장하면 같은 요청으로 이어서 확인합니다.");
  }
}

/** 결과를 모르던 이전 저장 요청이 같은 키로 이미 리워드를 만들었거나 아직 처리 중이다. */
export class RewardAlreadySubmittedError extends Error {
  constructor() {
    super(
      "이전에 저장하던 리워드가 이미 등록됐거나 처리 중이라 이번 내용은 저장하지 않았습니다. 리워드 목록을 확인한 뒤 필요하면 다시 저장해주세요.",
    );
  }
}

/* 판매자·프로젝트마다 결과를 모르는 생성 시도 하나의 키를 남긴다. 성공하거나 서버가 이 키의 리워드가
   있다고 알릴(409) 때까지 같은 키를 쓴다. 확정 4xx도 이전 요청이 만든 리워드를 부정하지 못해 키를 남긴다. */
export async function createRewardOnce(
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem">,
  memberId: string,
  projectId: string,
  body: RewardRequest,
) {
  const storageKey = `fundit-reward-create:${memberId}:${projectId}`;
  const key = storage.getItem(storageKey) ?? crypto.randomUUID();
  // 요청 전에 남겨야 응답 유실·새로고침 뒤에도 같은 키로 서버 결과를 되찾는다.
  storage.setItem(storageKey, key);
  let reward: RewardResponse;
  try {
    reward = await createReward(projectId, body, key);
  } catch (error) {
    if (error instanceof ApiError && error.code === "CONFLICT") {
      storage.removeItem(storageKey);
      throw new RewardAlreadySubmittedError();
    }
    if (error instanceof ApiError && error.status >= 400 && error.status < 500) throw error;
    throw new RewardCreationUncertainError();
  }
  if (!Number.isSafeInteger(reward?.rewardId) || reward.rewardId <= 0)
    throw new RewardCreationUncertainError();
  storage.removeItem(storageKey);
  return reward;
}
