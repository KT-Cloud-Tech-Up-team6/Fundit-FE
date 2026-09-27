/* 실제 주문서의 주문 상품 줄(노션 FE 자체 판단 81). 리워드 선택과 같은 화면 모델(toRewards)을 써서
   리워드명·옵션·예상 발송일 규칙을 한곳에 둔다. 줄 금액은 BE가 청구하는 정가 기준이다 — BE 주문 금액
   계산이 얼리 버드 할인을 반영하지 않아, 결제 화면에서 줄 금액과 결제 금액이 어긋나지 않게 맞춘다
   (2026-09-28 사용자 결정). BE가 할인을 반영하면 리워드 선택처럼 할인가·정가 취소선으로 되돌린다. */
import type { OrderLine } from "../../../entities/order/api/order-api";
import type { Reward } from "../../reward-selection/model/reward-demo";

export type CheckoutLineItem = {
  /** "리워드명 · 옵션 · N개". 옵션 그룹이 여럿이면 리워드 선택처럼 " / "로 잇는다. */
  label: string;
  expectedShipping?: string;
  /** 청구 기준 단가(정가) × 수량. 조회 결과에 없는 리워드면 없다. */
  price?: number;
};

export function checkoutLineItems(lines: OrderLine[], rewards: Reward[]): CheckoutLineItem[] {
  return lines.map((line) => {
    const reward = rewards.find((item) => item.rewardId === line.rewardId);
    if (!reward) return { label: `찾을 수 없는 리워드 · ${line.quantity}개` };
    const option = reward.options
      .flatMap((group) =>
        group.values.filter(
          (value) => value.id !== undefined && line.optionValueIds.includes(value.id),
        ),
      )
      .map((value) => value.label)
      .join(" / ");
    return {
      label: [reward.name, option, `${line.quantity}개`].filter(Boolean).join(" · "),
      expectedShipping: reward.expectedShipping,
      /* toRewards는 얼리 버드면 할인가를 price에, 정가를 originalPrice에 둔다. */
      price: (reward.originalPrice ?? reward.price) * line.quantity,
    };
  });
}
