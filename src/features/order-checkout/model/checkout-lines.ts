/* 실제 주문서의 주문 상품 줄(노션 FE 자체 판단 81). 리워드 선택과 같은 화면 모델(toRewards)을 써서
   리워드명·옵션·금액 규칙을 한곳에 둔다. BE #181부터 주문 금액이 얼리 버드 할인가로 계산되므로(요청서
   BE-22) 줄 금액도 할인가이고, Figma `price_information`처럼 정가 취소선을 함께 둔다. */
import type { OrderLine } from "../../../entities/order/api/order-api";
import type { Reward } from "../../reward-selection/model/reward-demo";

export type CheckoutLineItem = {
  /** "리워드명 · 옵션 · N개". 옵션 그룹이 여럿이면 리워드 선택처럼 " / "로 잇는다. */
  label: string;
  /** 청구 단가(얼리 버드면 할인가) × 수량. 조회 결과에 없는 리워드면 없다. */
  price?: number;
  /** 얼리 버드일 때만 정가 × 수량(취소선). */
  originalPrice?: number;
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
      /* toRewards는 얼리 버드면 할인가를 price에, 정가를 originalPrice에 둔다. */
      price: reward.price * line.quantity,
      ...(reward.originalPrice === undefined
        ? {}
        : { originalPrice: reward.originalPrice * line.quantity }),
    };
  });
}

/** 결제 금액의 ㄴ펀딩 금액(Figma는 정가 합계). 금액을 모르는 줄이 있으면 주문할 수 없어 쓰이지 않는다. */
export function listPriceTotal(items: CheckoutLineItem[]): number {
  return items.reduce((sum, item) => sum + (item.originalPrice ?? item.price ?? 0), 0);
}

/** 줄 청구 금액 합계가 BE 미리보기 `rewardAmount`와 같을 때만 얼리 버드 표시가 실제 청구와 맞다. 다르면
    BE #181 이전 BE가 정가로 청구했거나, 리워드 조회와 미리보기 사이에 가격이 바뀐 것이다(주문서에
    들어오면 리워드를 다시 조회한다). */
export function isBilledAsShown(items: CheckoutLineItem[], rewardAmount: number): boolean {
  return items.reduce((sum, item) => sum + (item.price ?? 0), 0) === rewardAmount;
}

/** 청구와 맞지 않는 얼리 버드 할인을 보이지 않도록 줄을 정가("상품 금액")로 되돌린다. */
export function withoutEarlyBird(items: CheckoutLineItem[]): CheckoutLineItem[] {
  return items.map(({ label, price, originalPrice }) =>
    price === undefined ? { label } : { label, price: originalPrice ?? price },
  );
}
