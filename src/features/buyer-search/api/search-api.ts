import { apiRequest } from "../../../shared/api/client";
import type { ApiPage } from "../../../entities/project/api/buyer-project-api";

export type SellerSearchItem = {
  sellerId: string;
  sellerDisplayName: string;
  ongoingProjectCount: number;
  totalProjectCount: number;
};
export type RecentKeyword = { keyword: string; searchedAt: string };
export type PopularKeyword = { keyword: string; rank: number };

export function searchSellers(keyword: string, page: number, signal?: AbortSignal) {
  const params = new URLSearchParams({ keyword, page: String(page), size: "20" });
  return apiRequest<ApiPage<SellerSearchItem>>(`/api/v1/search/sellers?${params}`, { signal });
}

export function getRecentKeywords(signal?: AbortSignal) {
  return apiRequest<{ content: RecentKeyword[] }>("/api/v1/search/recent-keywords", {
    auth: true,
    signal,
  });
}

export function deleteRecentKeyword(keyword: string) {
  return apiRequest<void>(`/api/v1/search/recent-keywords/${encodeURIComponent(keyword)}`, {
    auth: true,
    method: "DELETE",
  });
}

export function getPopularKeywords(signal?: AbortSignal) {
  return apiRequest<{ content: PopularKeyword[] }>("/api/v1/search/popular-keywords", { signal });
}
