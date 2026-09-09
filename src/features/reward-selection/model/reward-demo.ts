/* 리워드 선택 바텀시트(FL_B_PY_RWRD)의 화면 데이터와 순수 헬퍼.
   ponytail: 리워드 조회 API가 없어(docs/OPEN_DECISIONS.md P1) 값은 목업 상수다.
   API가 생기면 이 파일의 타입을 응답 스키마(docs/API_CONTRACT.md §7)에 맞추고
   포맷 헬퍼는 그대로 재사용한다. */

/** docs/API_CONTRACT.md §7: options 는 [{groupName, values: string[]}] 형태. */
export type RewardOptionGroup = { groupName: string; values: string[] };

export type Reward = {
  id: string;
  name: string;
  price: number;
  /** 정가 취소선용. 스키마에 비교가 필드가 없어 목업 고정값이다(docs/REWARD_SELECTION.md 미확정 항목). */
  originalPrice?: number;
  /** "얼리 버드 N%" 배지 문구용. 위와 같은 이유로 목업 고정값. */
  earlyBirdRate?: number;
  isEarlyBird: boolean;
  /** true 면 "선착순 한정" 배지를 단다(docs/API_CONTRACT.md §7 isLimited). */
  isLimited: boolean;
  /** 기타 혜택 칩 문구. 예: "소모품 1년치 포함". */
  perks: string[];
  /** 메타 줄에 가운뎃점으로 잇는 조각. 예: ["무료배송", "색상 2종"] / ["무료배송", "예상 발송일 2026.09.21"]. */
  meta: string[];
  options: RewardOptionGroup[];
};

/** 담은 옵션 조합 1줄. 리워드에 옵션이 있으면 value 는 고른 값, 없으면 null(수량만). */
export type RewardLine = { value: string | null; quantity: number };

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

/** 목록에 value 와 같은 줄이 있으면 그 줄 수량 +1, 없으면 새 줄 추가. */
export function addOptionLine(lines: RewardLine[], value: string): RewardLine[] {
  const index = lines.findIndex((line) => line.value === value);
  if (index === -1) return [...lines, { value, quantity: 1 }];
  return lines.map((line, i) => (i === index ? { ...line, quantity: line.quantity + 1 } : line));
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
      meta: ["무료배송", "예상 발송일 2026.09.21"],
      options: [{ groupName: "색상", values: ["블랙", "화이트"] }],
    },
    {
      id: "reward-standard",
      name: "스탠다드 클린포지 R1",
      price: 699_000,
      isEarlyBird: false,
      isLimited: false,
      perks: [],
      meta: ["무료배송", "색상 2종"],
      options: [{ groupName: "색상", values: ["블랙", "화이트"] }],
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
