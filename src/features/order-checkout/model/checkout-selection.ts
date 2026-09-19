import type { OrderSelection } from "@/entities/order/model/order-session";
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
        meta: ["예상 발송일 2026.10.12"],
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
    shippingFee: 0,
    couponDiscount: 0,
    pointDiscount: 0,
  };
}
