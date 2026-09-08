export const businessTypes = ["일반", "개인 사업자", "법인 사업자"] as const;
export const mainCategories = ["테크 · 가전", "홈 · 리빙", "뷰티", "패션", "도서"] as const;
export const homeCategories = ["침실", "욕실", "주방", "인테리어", "청소 · 세탁"] as const;
export const amountSteps = [100_000, 500_000, 1_000_000, 5_000_000, 10_000_000];

export type RewardDraft = {
  name: string;
  description: string;
  price: string;
  quantity: string;
  limited: boolean;
  earlyBird: boolean;
  options: boolean;
};
export type DemoReward = RewardDraft & { id: number };

export function emptyReward(): RewardDraft {
  return {
    name: "",
    description: "",
    price: "",
    quantity: "",
    limited: false,
    earlyBird: false,
    options: false,
  };
}

export const demoRewards: DemoReward[] = [
  {
    ...emptyReward(),
    id: 1,
    name: "얼리버드 패키지",
    price: "29000",
    quantity: "100",
    limited: true,
    earlyBird: true,
  },
  { ...emptyReward(), id: 2, name: "기본 패키지", price: "39000" },
];

export function positiveInteger(value: string) {
  return /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) > 0;
}

export function rewardError(reward: RewardDraft) {
  if (!reward.name.trim()) return "리워드 이름을 입력해주세요.";
  if (!positiveInteger(reward.price)) return "리워드 가격을 양의 정수로 입력해주세요.";
  if (reward.limited && !positiveInteger(reward.quantity))
    return "제한 수량을 양의 정수로 입력해주세요.";
  return "";
}

export function upsertReward(rewards: DemoReward[], draft: RewardDraft, id: number) {
  if (rewardError(draft)) return rewards;
  const reward = {
    ...draft,
    name: draft.name.trim(),
    quantity: draft.limited ? draft.quantity : "",
    id,
  };
  return rewards.some((item) => item.id === id)
    ? rewards.map((item) => (item.id === id ? reward : item))
    : [...rewards, reward];
}

export function addAmount(value: string, increment: number) {
  const current = value === "" ? 0 : Number(value);
  const next = current + increment;
  return Number.isSafeInteger(current) && current >= 0 && Number.isSafeInteger(next)
    ? String(next)
    : value;
}
