import type { ProjectCardResponse } from "../api/buyer-project-api";

export function projectCard(row: ProjectCardResponse) {
  return {
    id: String(row.projectId),
    title: row.title,
    seller: row.sellerDisplayName,
    image: row.thumbnailUrl ?? "",
    thumbnail: row.thumbnailUrl ?? "",
    progress: row.achievementRate,
    closed: row.status === "SUCCEEDED" || row.status === "FAILED",
    created: 0,
    likes: 0,
    deadline: row.remainingDays,
  };
}
