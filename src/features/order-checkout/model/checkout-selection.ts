import type { OrderSelection } from "@/entities/order/model/order-session";
import { SHIPPING_FEE } from "@/features/reward-selection/model/reward-demo";
import type { OrderItem, PaymentSummary } from "./checkout-demo";

export type CheckoutReward = { id: string; name: string; price: number; originalPrice?: number };

export function checkoutItems(
  rewards: CheckoutReward[],
  cart: OrderSelection["cart"],
  project: { title: string; image: string },
): OrderItem[] {
  return Object.entries(cart).flatMap(([id, lines]) => {
    const reward = rewards.find((item) => item.id === id);
    if (!reward) return [];
    return lines
      .filter((line) => Number.isSafeInteger(line.quantity) && line.quantity > 0)
      .map((line) => ({
        projectTitle: project.title,
        rewardName: reward.name,
        quantity: line.quantity,
        originalPrice: reward.originalPrice ?? reward.price,
        price: reward.price,
        image: project.image,
        option: line.value ?? undefined,
        meta: [],
      }));
  });
}

export function checkoutSummary(items: OrderItem[]): PaymentSummary {
  return {
    fundingAmount: items.reduce((sum, item) => sum + item.originalPrice * item.quantity, 0),
    earlyBirdDiscount: items.reduce(
      (sum, item) =>
        sum + (item.originalPrice - (item.price ?? item.originalPrice)) * item.quantity,
      0,
    ),
    /* 리워드 선택 시트와 같은 기준: 담은 게 있을 때만, 리워드 개수와 무관하게 1건당 한 번. */
    shippingFee: items.length > 0 ? SHIPPING_FEE : 0,
    couponDiscount: 0,
    pointDiscount: 0,
  };
}
