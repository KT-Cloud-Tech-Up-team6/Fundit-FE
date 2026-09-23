"use client";

import { ErrorState } from "@/shared/components/ui/error-state";

/* 구매자 상세와 스토리 미리보기가 같은 표시를 쓰도록 분리했다. 판매자 리워드 응답에는 품절
   여부가 없으므로 선택 항목으로 둔다. */
export type RewardSummaryItem = {
  rewardId: number;
  name: string;
  description: string;
  price: number;
  isEarlyBird: boolean;
  earlyBirdDiscountedPrice: number | null;
  soldOut?: boolean;
};

export function RewardSummary({
  rewards,
  isPending,
  isError,
  onRetry,
}: {
  rewards: RewardSummaryItem[] | undefined;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  return (
    <section className="space-y-3 p-5">
      <h2 className="text-title-s">리워드</h2>
      {isPending ? (
        <p role="status">불러오는 중입니다.</p>
      ) : isError ? (
        <ErrorState
          variant="section"
          description="리워드 조회를 실패하였습니다"
          action={{ onClick: onRetry }}
        />
      ) : (
        rewards?.map((reward) => (
          <article key={reward.rewardId} className="border-border-default border-b pb-3">
            <h3>{reward.name}</h3>
            <p>{reward.description}</p>
            <p>
              {(reward.isEarlyBird
                ? (reward.earlyBirdDiscountedPrice ?? reward.price)
                : reward.price
              ).toLocaleString("ko-KR")}
              원
            </p>
            {reward.soldOut && <p>품절</p>}
          </article>
        ))
      )}
    </section>
  );
}
