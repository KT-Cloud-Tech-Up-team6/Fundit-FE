export const businessTypes = ["일반 사업자", "개인 사업자", "법인 사업자"] as const;
export const amountSteps = [100_000, 500_000, 1_000_000, 5_000_000];

export type RewardDraft = {
  name: string;
  description: string;
  price: string;
  quantity: string;
  limited: boolean;
  discount: boolean;
  discountValue: string;
  discountUnit: "won" | "percent";
  imageName: string;
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
    discount: false,
    discountValue: "",
    discountUnit: "won",
    imageName: "",
    options: false,
  };
}

export const demoRewards: DemoReward[] = [
  {
    ...emptyReward(),
    id: 1,
    name: "할인 패키지",
    price: "29000",
    quantity: "100",
    limited: true,
    discount: true,
    discountValue: "5000",
    imageName: "reward-package.jpg",
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
  if (reward.discount) {
    if (!positiveInteger(reward.discountValue)) return "할인 값을 입력해주세요.";
    if (reward.discountUnit === "won" && Number(reward.discountValue) >= Number(reward.price))
      return "할인 금액은 리워드 가격보다 작아야 합니다.";
    if (reward.discountUnit === "percent" && Number(reward.discountValue) > 100)
      return "할인율은 1~100%로 입력해주세요.";
  }
  return "";
}

export function convertDiscount(
  value: string,
  from: "won" | "percent",
  to: "won" | "percent",
  price: string,
) {
  if (!positiveInteger(value) || !positiveInteger(price) || from === to) return value;
  const amount = Number(value);
  const base = Number(price);
  return from === "won"
    ? String(Math.round((amount / base) * 100))
    : String(Math.round((base * amount) / 100));
}

export function discountedPrice(
  reward: Pick<RewardDraft, "price" | "discount" | "discountValue" | "discountUnit">,
) {
  const price = Number(reward.price);
  if (!reward.discount || !positiveInteger(reward.discountValue) || !Number.isSafeInteger(price))
    return price;
  const discount =
    reward.discountUnit === "won"
      ? Number(reward.discountValue)
      : Math.round((price * Number(reward.discountValue)) / 100);
  return Math.max(0, price - discount);
}

export function basicInfoError(input: {
  business: string;
  title: string;
  category: string;
  subcategory: string;
  amount: string;
  rewards: readonly DemoReward[];
}) {
  if (!input.business) return "사업자 유형을 선택해주세요.";
  if (!input.title.trim()) return "프로젝트 제목을 입력해주세요.";
  if (!input.category) return "프로젝트 카테고리를 선택해주세요.";
  if (!input.subcategory) return "상세 카테고리를 선택해주세요.";
  if (!positiveInteger(input.amount) || Number(input.amount) < 500_000)
    return "목표 금액은 최소 500,000원 이상의 정수로 입력해주세요.";
  if (!input.rewards.length) return "리워드를 최소 1개 등록해주세요.";
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
