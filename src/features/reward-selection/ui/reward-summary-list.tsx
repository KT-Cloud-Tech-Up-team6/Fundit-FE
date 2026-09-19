import { Badge } from "@/shared/components/ui/badge";
import { designRewards, formatWon } from "../model/reward-demo";

export function RewardSummaryList() {
  return (
    <section aria-label="리워드 안내" className="flex flex-col gap-3">
      <h2 className="text-title-s">리워드 선택</h2>
      <ul className="space-y-3">
        {designRewards().map((reward) => (
          <li key={reward.id} className="border-border-default rounded-xs border px-4 py-3">
            <div className="mb-1 flex flex-wrap gap-1">
              {[
                ...(reward.isEarlyBird ? [`얼리 버드 ${reward.earlyBirdRate}%`] : []),
                ...(reward.isLimited ? ["선착순 한정"] : []),
                ...reward.perks,
              ].map((label) => (
                <Badge key={label} variant="accent" shape="rounded">
                  {label}
                </Badge>
              ))}
            </div>
            <div className="flex items-end justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-body-strong truncate" title={reward.name}>
                  {reward.name}
                </h3>
                <p className="text-caption-s mt-2 truncate" title={reward.meta.join(" · ")}>
                  {reward.meta.join(" · ")}
                </p>
              </div>
              <p className="shrink-0 text-right">
                {reward.originalPrice && (
                  <del className="text-body-s text-text-secondary block">
                    {formatWon(reward.originalPrice)}
                  </del>
                )}
                <span className="text-title-s">{formatWon(reward.price)}</span>
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
