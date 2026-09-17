"use client";

import { Badge } from "@/shared/components/ui/badge";
import type { Reward } from "../model/reward-demo";
import { formatWon } from "../model/reward-demo";

export function RewardCard({ reward, onSelect }: { reward: Reward; onSelect: () => void }) {
  const badges = [
    ...(reward.isEarlyBird && reward.earlyBirdRate !== undefined
      ? [`얼리 버드 ${reward.earlyBirdRate}%`]
      : []),
    ...(reward.isLimited ? ["선착순 한정"] : []),
    ...reward.perks,
  ];
  return (
    <button
      type="button"
      aria-label={reward.name}
      onClick={onSelect}
      className="border-border-default focus-visible:outline-border-primary flex w-full flex-col gap-1 border-b px-4 py-3 text-left last:border-0 focus-visible:outline-2 focus-visible:-outline-offset-2"
    >
      {badges.length > 0 && (
        <span className="flex flex-wrap gap-1">
          {badges.map((badge) => (
            <Badge key={badge} shape="rounded" variant="neutral" className="text-text-info">
              {badge}
            </Badge>
          ))}
        </span>
      )}
      <span className="flex w-full items-start justify-between gap-2">
        <span className="text-body-strong w-[184px] min-w-0 truncate" title={reward.name}>
          {reward.name}
        </span>
        <span className="flex shrink-0 flex-col items-end">
          {reward.originalPrice && (
            <span className="text-body-s text-text-secondary line-through">
              {formatWon(reward.originalPrice)}
            </span>
          )}
          <span className="text-title-s">{formatWon(reward.price)}</span>
        </span>
      </span>
      <span className="text-caption-s w-full truncate" title={reward.meta.join(" · ")}>
        {reward.meta.join(" · ")}
      </span>
    </button>
  );
}
