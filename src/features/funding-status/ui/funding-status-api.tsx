"use client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import {
  getFundingStatus,
  getWishStats,
  getRewardNames,
} from "@/entities/project/api/project-management-api";
import type { ManagementProject } from "@/entities/project/api/project-management-api";
import { FundingStatusBoard } from "./funding-status-board";

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
    queryFn: ({ signal }) => getRewardNames(id, signal),
  });
  if (status.isPending || wishes.isPending || rewards.isPending)
    return <p role="status">펀딩 현황을 불러오고 있습니다.</p>;
  if (status.isError || wishes.isError || rewards.isError)
    return (
      <p role="alert">
        펀딩 현황을 불러오지 못했습니다.{" "}
        <button
          type="button"
          onClick={() => {
            void status.refetch();
            void wishes.refetch();
            void rewards.refetch();
          }}
        >
          다시 시도
        </button>
      </p>
    );
  const data = status.data;
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
        dday:
          data.remainingDays === null
            ? "기간 미정"
            : data.remainingDays <= 0
              ? "종료"
              : `D-${data.remainingDays}`,
        closedBadge:
          project.status === "SUCCEEDED"
            ? { label: "펀딩 성공", variant: "success" }
            : project.status === "FAILED"
              ? { label: "펀딩 실패", variant: "neutral" }
              : null,
      }}
      rewards={data.rewardStats.map((stat) => ({
        id: String(stat.rewardId),
        name:
          rewards.data.find((reward) => reward.rewardId === stat.rewardId)?.name ??
          `리워드 ${stat.rewardId}`,
        option: "—",
        quantity: stat.purchasedQuantity,
        amount: null,
      }))}
    />
  );
}
