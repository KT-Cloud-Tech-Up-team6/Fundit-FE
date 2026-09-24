import { apiRequest } from "@/shared/api/client";
import type { LivePage, LiveStatus } from "./seller-live-api";

/** 소비자 LIVE 목록 조건(BE `LiveController.findPublic`). 비인증이고 DRAFT는 나오지 않는다. */
export type PublicLivesQuery = {
  /** 비우면 SCHEDULED·LIVE·ENDED·ERROR 전부다. */
  status?: Exclude<LiveStatus, "DRAFT">;
  /** `viewerCount`면 방송 중인 LIVE만 시청자 수 내림차순이고 status·sellerId는 무시된다.
      없으면 생성 최신순이다. */
  sort?: "viewerCount";
  /** 이 판매자들의 LIVE만. 쉼표로 이어 보낸다. */
  sellerIds?: readonly string[];
};

/** 첫 페이지(기본 20건)만 받는다. LIVE 메인은 섹션마다 한두 칸만 채운다. */
export function getPublicLives(
  { status, sort, sellerIds }: PublicLivesQuery,
  signal?: AbortSignal,
) {
  const query = new URLSearchParams();
  if (status) query.set("status", status);
  if (sort) query.set("sort", sort);
  if (sellerIds?.length) query.set("sellerId", sellerIds.join(","));
  const search = query.toString();
  return apiRequest<LivePage>(`/api/v1/lives${search ? `?${search}` : ""}`, { signal });
}
