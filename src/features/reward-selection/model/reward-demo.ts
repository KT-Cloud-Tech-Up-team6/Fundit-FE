/* 리워드 선택 바텀시트(FL_B_PY_RWRD)의 화면 모델과 순수 헬퍼.
   데모 프로젝트는 아래 목업 리워드를 쓰고, 실제(UUID) 프로젝트는 리워드 조회 API 응답을
   public-reward.ts의 toRewards로 이 모델에 옮겨 같은 시트·카드·장바구니 헬퍼를 쓴다. */

/** 옵션 값. id는 API 리워드의 옵션 값 id(주문 optionValueIds)이고 목업에는 없다. */
export type RewardOptionValue = { label: string; id?: number };

export type RewardOptionGroup = { groupName: string; values: RewardOptionValue[] };

export type Reward = {
  /** 장바구니 키. API 리워드는 숫자 키가 삽입 순서를 잃지 않도록 `reward-{rewardId}`로 둔다. */
  id: string;
  /** API 리워드의 주문 전송 id. 목업에는 없다. */
  rewardId?: number;
  name: string;
  /** 화면·합계에 쓰는 단가. 얼리 버드면 할인가다. */
  price: number;
  /** 정가 취소선용. */
  originalPrice?: number;
  /** "얼리 버드 N%" 배지 문구용. 없으면 "얼리 버드"만 단다. */
  earlyBirdRate?: number;
  isEarlyBird: boolean;
  /** true 면 "선착순 한정" 배지를 단다. */
  isLimited: boolean;
  /** 기타 혜택 칩 문구. 예: "소모품 1년치 포함". */
  perks: string[];
  /** 메타 줄에 가운뎃점으로 잇는 조각. 예: ["색상 2종"]. 배송비는 카드가 아니라 결제 금액
      요약에서만 안내한다(2026-09-28 사용자 결정). */
  meta: string[];
  soldOut?: boolean;
  /** 남은 재고. 없으면 수량 제한이 없다. 같은 리워드의 모든 줄 수량 합의 상한이다. */
  remainingStock?: number;
  options: RewardOptionGroup[];
};

/** 담은 옵션 조합 1줄. value 는 고른 옵션 문구(그룹이 여럿이면 " / "로 잇는다), 옵션이 없으면 null(수량만).
    optionValueIds 는 API 리워드의 옵션 값 id(그룹 순서)이고 목업에는 없다. */
export type RewardLine = { value: string | null; quantity: number; optionValueIds?: number[] };

/** rewardId → 담은 줄 목록. 키가 있으면 선택된 것이다(옵션 리워드는 줄이 0개일 수 있다). */
export type RewardCart = Record<string, RewardLine[]>;

/** 5000000 → "5,000,000원" */
export function formatWon(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

/** 리워드가 × 수량. 수량이 1 미만이면 1로 본다. */
export function calcTotal(reward: Pick<Reward, "price">, quantity: number): number {
  return reward.price * Math.max(1, Math.trunc(quantity));
}

/** 리워드를 담을 때 초기 줄. 옵션 없으면 수량 1짜리 한 줄, 옵션 있으면 빈 목록. */
export function initialLines(reward: Pick<Reward, "options">): RewardLine[] {
  return reward.options.length === 0 ? [{ value: null, quantity: 1 }] : [];
}

/** 같은 옵션 조합인지 가르는 키. API 리워드는 옵션 값 id로, 목업은 문구로 비교한다. */
export function lineKey(line: Pick<RewardLine, "value" | "optionValueIds">): string {
  return line.optionValueIds?.join(",") ?? line.value ?? "";
}

/** 목록에 같은 옵션 조합 줄이 있으면 그 줄 수량 +1, 없으면 새 줄 추가. */
export function addOptionLine(
  lines: RewardLine[],
  value: string,
  optionValueIds?: number[],
): RewardLine[] {
  const key = lineKey({ value, optionValueIds });
  const index = lines.findIndex((line) => lineKey(line) === key);
  if (index === -1)
    return [
      ...lines,
      optionValueIds ? { value, quantity: 1, optionValueIds } : { value, quantity: 1 },
    ];
  return lines.map((line, i) => (i === index ? { ...line, quantity: line.quantity + 1 } : line));
}

/** 옵션 그룹마다 고른 값 순번으로 줄에 담을 문구·id를 만든다. 아직 안 고른 그룹이 있으면 null.
    picks[i]는 i번째 그룹에서 고른 값의 순번이다. */
export function pickedOption(
  reward: Pick<Reward, "options">,
  picks: (number | undefined)[],
): { value: string; optionValueIds?: number[] } | null {
  const values = reward.options.map((group, index) => {
    const pick = picks[index];
    return pick === undefined ? undefined : group.values[pick];
  });
  if (!values.every((value): value is RewardOptionValue => value !== undefined)) return null;
  const value = values.map((item) => item.label).join(" / ");
  const ids = values.map((item) => item.id);
  return ids.every((id): id is number => id !== undefined)
    ? { value, optionValueIds: ids }
    : { value };
}

/** 재고에서 이 리워드의 담은 줄 수량 합을 뺀 값. 재고 제한이 없으면 undefined. */
export function remainingFor(
  reward: Pick<Reward, "remainingStock">,
  lines: RewardLine[],
): number | undefined {
  if (reward.remainingStock === undefined) return undefined;
  return reward.remainingStock - lines.reduce((sum, line) => sum + line.quantity, 0);
}

/** 담은 모든 줄의 (리워드가 × 수량) 합. */
export function calcCartTotal(rewards: Reward[], cart: RewardCart): number {
  return rewards.reduce((sum, reward) => {
    const lines = cart[reward.id];
    if (!lines) return sum;
    return sum + lines.reduce((s, line) => s + calcTotal(reward, line.quantity), 0);
  }, 0);
}

/** 담은 게 1건 이상이고, 담은 리워드마다 줄이 1개 이상인지(펀딩하기 활성 조건). */
export function isCartSubmittable(cart: RewardCart): boolean {
  const lists = Object.values(cart);
  return lists.length > 0 && lists.every((lines) => lines.length > 0);
}

export function demoRewards(): Reward[] {
  return [
    {
      id: "reward-early-bird",
      name: "얼리버드 클린포지 R1",
      price: 599_000,
      originalPrice: 699_000,
      earlyBirdRate: 14,
      isEarlyBird: true,
      isLimited: true,
      perks: [],
      meta: [],
      options: [{ groupName: "색상", values: [{ label: "블랙" }, { label: "화이트" }] }],
    },
    {
      id: "reward-standard",
      name: "스탠다드 클린포지 R1",
      price: 699_000,
      isEarlyBird: false,
      isLimited: false,
      perks: [],
      meta: ["색상 2종"],
      options: [{ groupName: "색상", values: [{ label: "블랙" }, { label: "화이트" }] }],
    },
    {
      id: "reward-deluxe",
      name: "디럭스 소모품 풀세트",
      price: 789_000,
      isEarlyBird: false,
      isLimited: false,
      perks: ["소모품 1년치 포함"],
      meta: ["사이드브러시 4", "먼지봉투 6", "물걸레패드 4"],
      options: [],
    },
    {
      id: "reward-family",
      name: "패밀리 듀얼팩 (본체 2대)",
      price: 1_320_000,
      isEarlyBird: false,
      isLimited: false,
      perks: [],
      meta: ["복층", "2대 사용 가구 추천"],
      options: [],
    },
  ];
}

export function designRewards(): Reward[] {
  return [
    {
      id: "reward-starter",
      name: "가장 먼저 만나는 스타터 세트",
      price: 199_000,
      originalPrice: 219_900,
      earlyBirdRate: 14,
      isEarlyBird: true,
      isLimited: true,
      perks: [],
      meta: ["무선청소기 본체", "기본 브러쉬", "충전 어댑터"],
      options: [],
    },
    {
      id: "reward-standard",
      name: "스탠다드 세트",
      price: 219_000,
      isEarlyBird: false,
      isLimited: false,
      perks: [],
      meta: ["무선청소기 본체", "브러쉬 2종", "충전 어댑터"],
      options: [],
    },
    {
      id: "reward-all-in-one",
      name: "한 번에 갖추는 올인원 패키지",
      price: 269_000,
      isEarlyBird: false,
      isLimited: false,
      perks: ["추가 필터 포함"],
      meta: ["무선청소기 본체", "브러쉬 4종", "전용 거치대", "추가 필터 2개"],
      options: [],
    },
    {
      id: "reward-multi-clean",
      name: "구석부터 침구까지 멀티 클린 세트",
      price: 239_000,
      isEarlyBird: false,
      isLimited: false,
      perks: [],
      meta: ["무선청소기 본체", "브러쉬 3종", "충전 어댑터"],
      options: [],
    },
    {
      id: "reward-family",
      name: "우리 집과 부모님 댁 패밀리 세트",
      price: 389_000,
      originalPrice: 438_000,
      isEarlyBird: false,
      isLimited: false,
      perks: ["함께할수록 더 저렴하게"],
      meta: ["본체 2대", "기본 브러시 2개", "충전 어댑터 2개"],
      options: [],
    },
  ];
}
