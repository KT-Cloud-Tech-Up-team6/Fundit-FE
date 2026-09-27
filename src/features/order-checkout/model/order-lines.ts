import type { OrderLine } from "../../../entities/order/api/order-api";
import type { PublicReward } from "../../../entities/project/api/buyer-project-api";

/**
 * 주문서가 넘겨받은 줄을 그대로 주문할 수 있는지. 줄마다 리워드가 있고 품절이 아니며 수량이 양수이고,
 * 옵션 그룹마다 값이 하나씩 골라져 있어야 한다. 재고는 같은 리워드 줄들의 수량 합으로 비교한다 —
 * 상세 리워드 선택이 같은 리워드의 모든 옵션 줄 합을 재고로 막는 것과 같은 상한이다(#378).
 */
export function isOrderable(
  lines: readonly OrderLine[],
  rewards: readonly PublicReward[] | undefined,
): boolean {
  if (!lines.length || !rewards) return false;
  const findReward = (rewardId: number) => rewards.find((reward) => reward.rewardId === rewardId);
  const linesValid = lines.every((line) => {
    const reward = findReward(line.rewardId);
    return (
      reward !== undefined &&
      !reward.soldOut &&
      Number.isSafeInteger(line.quantity) &&
      line.quantity > 0 &&
      line.optionValueIds.every((id) =>
        reward.options.some((group) => group.values.some((value) => value.valueId === id)),
      ) &&
      line.optionValueIds.length === reward.options.length &&
      reward.options.every((group) =>
        line.optionValueIds.some((id) => group.values.some((value) => value.valueId === id)),
      )
    );
  });
  if (!linesValid) return false;
  const totals = new Map<number, number>();
  for (const line of lines)
    totals.set(line.rewardId, (totals.get(line.rewardId) ?? 0) + line.quantity);
  return [...totals].every(([rewardId, total]) => {
    const stock = findReward(rewardId)?.remainingStock;
    return stock == null || total <= stock;
  });
}
