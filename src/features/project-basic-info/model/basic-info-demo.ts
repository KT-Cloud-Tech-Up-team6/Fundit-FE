export const businessTypes = ["일반 사업자", "개인 사업자", "법인 사업자"] as const;
export const amountSteps = [100_000, 500_000, 1_000_000, 5_000_000];
export const REWARD_NAME_MAX_LENGTH = 100;

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
  optionGroups?: { optionGroupId?: number; groupName: string; values: string[] }[];
  optionSummary?: string;
  simpleRefundDisabled?: boolean;
};
/** `file`은 프로젝트 생성 뒤 올릴 이미지, `registered`는 서버에 이미 등록됐음을, `pending`은 등록
    결과를 몰라 같은 내용으로 다시 확인해야 함을 뜻한다. 둘 다 고칠 수 없다. */
export type DemoReward = RewardDraft & {
  id: number;
  file?: File;
  registered?: boolean;
  pending?: boolean;
};

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
    description: "얼리버드 할인이 적용된 패키지입니다.",
    price: "29000",
    quantity: "100",
    limited: true,
    discount: true,
    discountValue: "5000",
    imageName: "reward-package.jpg",
  },
  {
    ...emptyReward(),
    id: 2,
    name: "기본 패키지",
    description: "기본 구성 패키지입니다.",
    price: "39000",
  },
];

/** 입력을 숫자 문자열로 만든다: 쉼표와 앞자리 0을 지운다. 숫자가 아닌 글자가 있거나 16자리(안전한 정수의 최대 자리)를 넘으면 null(입력 거부). */
export function digitInput(value: string) {
  const digits = value.replaceAll(",", "");
  if (!/^\d*$/.test(digits)) return null;
  const next = digits.replace(/^0+(?=\d)/, "");
  return next.length > 16 ? null : next;
}

/** 숫자 문자열에 천 단위 쉼표를 붙인다. 화면 표시 전용이고 state에는 넣지 않는다. */
export function formatDigits(digits: string) {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** 쉼표가 보이는 칸의 입력 이벤트(raw, 커서 caret)를 숫자 문자열 `value`로 만들고,
 *  입력 뒤 커서가 놓여야 할 곳을 "커서 앞 숫자 개수" `caret`으로 돌려준다. 거부된 입력은 value가 null이다.
 *  쉼표만 지워진 입력은 숫자가 그대로라 state가 안 바뀌어 지워지지 않으므로, 쉼표 옆 숫자를 대신 지운다. */
export function editDigits(current: string, raw: string, caret: number, inputType = "") {
  const typed = raw.slice(0, caret).replace(/\D/g, "").length;
  const next = digitInput(raw);
  if (next === null) return { value: null, caret: Math.min(typed, current.length) };
  // 붙여넣기 등으로 같은 숫자가 쉼표 없이 들어온 경우와 구분하려고 삭제 이벤트일 때만 본다.
  const deleting = inputType === "deleteContentBackward" || inputType === "deleteContentForward";
  if (deleting && next === current && raw.length < formatDigits(current).length) {
    const cut = inputType === "deleteContentForward" ? typed : typed - 1;
    if (cut >= 0 && cut < current.length)
      return {
        value: digitInput(current.slice(0, cut) + current.slice(cut + 1)) ?? current,
        caret: cut,
      };
  }
  // 앞자리 0이 지워진 만큼 커서 앞 숫자도 줄어든다.
  return {
    value: next,
    caret: Math.max(0, typed - (raw.replaceAll(",", "").length - next.length)),
  };
}

/** 쉼표가 붙은 표시값에서 숫자 `count`개 바로 뒤의 커서 위치. */
export function caretAfterDigits(display: string, count: number) {
  let seen = 0;
  for (let i = 0; i < display.length && count > 0; i++) {
    if (display[i] !== "," && ++seen === count) return i + 1;
  }
  return count > 0 ? display.length : 0;
}

export function positiveInteger(value: string) {
  return /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) > 0;
}

export function rewardError(reward: RewardDraft) {
  if (!reward.name.trim()) return "리워드 이름을 입력해주세요.";
  if (reward.name.trim().length > REWARD_NAME_MAX_LENGTH)
    return "리워드 이름은 100자 이내로 입력해주세요.";
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
