import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/shared/components/ui/badge";
import { designRewards, formatWon, type Reward } from "../model/reward-demo";

export function LiveRewardSummary({
  projectId,
  rewards = designRewards(),
  state,
}: {
  projectId?: string;
  /** 실제 방송의 연결 프로젝트 리워드(#555). 주지 않으면 목업 리워드다. */
  rewards?: Reward[];
  /** 주면 목록 대신 그린다(불러오는 중·오류·없음). */
  state?: ReactNode;
}) {
  return (
    <section
      aria-label="리워드 안내"
      className="bg-layer-surface-default border-border-default flex h-100 min-h-0 flex-col gap-2 rounded-sm border px-4 py-3"
    >
      <h2 className="text-title-s flex items-center gap-2">
        리워드{" "}
        {!state && (
          <span className="text-body-s text-text-secondary font-normal">총 {rewards.length}개</span>
        )}
      </h2>
      {state ? (
        <div className="text-body-s text-text-secondary flex min-h-0 flex-1 items-center justify-center text-center">
          {state}
        </div>
      ) : (
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
                  /* 정액 할인 얼리 버드는 비율이 없어 "얼리 버드"만 단다(리워드 카드와 같음, 노션 FE 자체 판단 59). */
                  ...(reward.isEarlyBird
                    ? [
                        reward.earlyBirdRate === undefined
                          ? "얼리 버드"
                          : `얼리 버드 ${reward.earlyBirdRate}%`,
                      ]
                    : []),
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
      )}
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
