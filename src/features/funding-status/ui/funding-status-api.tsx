"use client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import { getFundingStatus, getWishStats } from "@/entities/project/api/project-management-api";
import { getSellerRewards } from "@/entities/project/api/reward-api";
import type { ManagementProject } from "@/entities/project/api/project-management-api";
import { ddayLabel } from "@/entities/project/model/remaining-days";
import { FundingStatusBoard } from "./funding-status-board";
import { QueryErrorState } from "@/shared/components/ui/query-error-state";

/** 프로젝트의 펀딩 현황을 조회하고 상태별 화면을 표시한다. */
export function FundingStatusApi({ project }: { project: ManagementProject }) {
  const { state } = useAuth();
  const id = project.projectId;
  const owner = state.user?.memberId;
  const status = useQuery({
    queryKey: ["funding-status", owner, id],
    queryFn: ({ signal }) => getFundingStatus(id, signal),
  });
  const wishes = useQuery({
    queryKey: ["wish-stats", owner, id],
    queryFn: ({ signal }) => getWishStats(id, signal),
  });
  const rewards = useQuery({
    queryKey: ["funding-reward-names", owner, id],
    queryFn: ({ signal }) => getSellerRewards(id, signal),
  });
  if (status.isPending || wishes.isPending || rewards.isPending)
    return <p role="status">펀딩 현황을 불러오고 있습니다.</p>;
  if (status.isError || wishes.isError || rewards.isError) {
    const error = status.isError ? status.error : wishes.isError ? wishes.error : rewards.error;
    return (
      <QueryErrorState
        error={error}
        onRetry={() => {
          void status.refetch();
          void wishes.refetch();
          void rewards.refetch();
        }}
        notFoundHref="/seller/projects"
      />
    );
  }
  const data = status.data;
  const rewardById = new Map(rewards.data.map((reward) => [reward.rewardId, reward]));
  const optionLabels = new Map<string, string>();
  for (const reward of rewards.data) {
    for (const group of reward.options ?? []) {
      for (const value of group.values) {
        if (value.valueId !== null)
          optionLabels.set(
            `${reward.rewardId}:${value.valueId}`,
            `${group.groupName}: ${value.value}`,
          );
      }
    }
  }
  return (
    <FundingStatusBoard
      summary={{
        title: project.title ?? "제목 없음",
        thumbnail: project.coverImageUrl ?? "",
        category: "—",
        period: { start: "—", end: "—" },
        goalAmount: project.goalAmount,
        raisedAmount: data.currentAmount,
        backerCount: data.participantCount,
        wishlistCount: wishes.data.wishCount,
        openAlertCount: wishes.data.openNotifyCount,
        dday: data.remainingDays === null ? "기간 미정" : ddayLabel(data.remainingDays),
        closedBadge:
          project.status === "SUCCEEDED"
            ? { label: "펀딩 성공", variant: "success" }
            : project.status === "FAILED"
              ? { label: "펀딩 실패", variant: "neutral" }
              : null,
      }}
      rewards={data.rewardStats.map((stat) => {
        const reward = rewardById.get(stat.rewardId);
        const option = optionLabels.get(`${stat.rewardId}:${stat.optionValueId}`);
        return {
          id: `${stat.rewardId}:${stat.optionValueId ?? "total"}`,
          name: reward?.name ?? `리워드 ${stat.rewardId}`,
          option: stat.optionValueId === null ? "리워드 합계" : (option ?? "옵션 정보 없음"),
          quantity: stat.purchasedQuantity,
          amount: stat.purchasedAmount,
        };
      })}
    />
  );
}
