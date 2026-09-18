import Link from "next/link";
import { Badge } from "@/shared/components/ui/badge";
import { designRewards, formatWon } from "../model/reward-demo";

export function LiveRewardSummary({ projectId }: { projectId?: string }) {
  const rewards = designRewards();
  return (
    <section
      aria-label="리워드 안내"
      className="bg-layer-surface-default border-border-default flex h-100 min-h-0 flex-col gap-2 rounded-sm border px-4 py-3"
    >
      <h2 className="text-title-s flex items-center gap-2">
        리워드{" "}
        <span className="text-body-s text-text-secondary font-normal">총 {rewards.length}개</span>
      </h2>
      <ul
        aria-label="리워드 목록"
        tabIndex={0}
        className="flex min-h-0 flex-1 [scrollbar-gutter:stable] flex-col gap-2 overflow-y-scroll overscroll-contain pr-3"
      >
        {rewards.map((reward) => (
          <li
            key={reward.id}
            className="border-border-default relative shrink-0 rounded-xs border px-3 py-2"
          >
            <div className="mb-1 flex flex-wrap gap-1 empty:hidden">
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
            <h3 className="text-body-strong truncate" title={reward.name}>
              {reward.name}
            </h3>
            <div className="mt-2">
              <p className="text-caption-s flex max-w-[210px] flex-wrap gap-x-1 gap-y-1">
                {reward.meta.map((item, index) => (
                  <span key={item} className="whitespace-nowrap">
                    {item}
                    {index < reward.meta.length - 1 && " ·"}
                  </span>
                ))}
              </p>
              <p className="absolute right-3 bottom-2 text-right">
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
      {projectId ? (
        <Link
          href={`/projects/${encodeURIComponent(projectId)}?tab=story`}
          className="bg-layer-surface-primary text-text-static-white text-body-s flex h-10 shrink-0 items-center justify-center rounded-xs"
        >
          상세 정보 보기
        </Link>
      ) : (
        <button
          type="button"
          disabled
          className="bg-layer-surface-disabled text-text-disabled text-body-s h-10 shrink-0 rounded-xs"
        >
          상세 정보 미연결
        </button>
      )}
    </section>
  );
}
