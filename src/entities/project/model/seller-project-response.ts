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

/**
 * 판매자 목록 카드와 펀딩 관리 헤더가 함께 쓰는 대분류·펀딩 기간(#559). 미리보기·상세 응답에는 펀딩 시작일이 없어
 * 펀딩 관리도 목록 항목에서 만든다.
 */
export function toFundingMeta(item: ProjectListItem) {
  return {
    category: item.categoryMajor ?? "미분류",
    period: { start: dateLabel(item.fundingStartAt), end: dateLabel(item.fundingDeadline) },
  };
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
  const { category, period } = toFundingMeta(item);
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
    category,
    period: `${period.start} - ${period.end}`,
    participantCount: item.participantCount,
    currentAmount: item.currentAmount,
    goalAmount: item.goalAmount ?? 0,
  };
}
