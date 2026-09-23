import type { ProjectListItem } from "../api/seller-project-api";
import type { SellerProject } from "./seller-project";
import { ddayLabel, remainingDays } from "./remaining-days";

function dateLabel(value: string | null) {
  if (!value) return "미정";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

export function toSellerProject(item: ProjectListItem, now = Date.now()): SellerProject {
  const base = {
    id: item.projectId,
    title: item.title || "제목 없음",
    thumbnail: item.thumbnailUrl ?? "",
  };
  if (item.status === "DRAFT") {
    return {
      ...base,
      status: "draft",
      badges: [],
      draftPhaseLabel: "준비중",
    };
  }
  return {
    ...base,
    status: item.status === "ONGOING" ? "active" : "closed",
    badges:
      item.status === "SUCCEEDED"
        ? [{ label: "펀딩 성공", variant: "success" }]
        : item.status === "FAILED"
          ? [{ label: "펀딩 실패", variant: "neutral" }]
          : item.fundingDeadline
            ? [{ label: ddayLabel(remainingDays(item.fundingDeadline, now)), variant: "neutral" }]
            : [],
    category: item.categoryMajor ?? "미분류",
    period: `${dateLabel(item.fundingStartAt)} - ${dateLabel(item.fundingDeadline)}`,
    participantCount: item.participantCount,
    currentAmount: item.currentAmount,
    goalAmount: item.goalAmount ?? 0,
  };
}
