import type { ProjectCardResponse } from "../api/buyer-project-api";
import { isPublicUuid } from "@/shared/lib/public-uuid";

export function projectCard(row: ProjectCardResponse) {
  return {
    id: String(row.projectId),
    detailId: isPublicUuid(row.projectPublicId) ? row.projectPublicId : null,
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
