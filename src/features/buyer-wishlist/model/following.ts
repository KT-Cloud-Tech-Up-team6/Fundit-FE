import type { LivePage } from "../../../entities/live/api/seller-live-api";
import type { FollowedSeller } from "../../../entities/seller/api/follow-api";

/* 관심 목록 팔로잉 행 이름(노션 FE 자체 판단 89). 목록 응답에는 판매자 표시명이 없어 회원 닉네임을
   먼저 쓰고, 없으면 BE가 이 목록에 함께 주는 회원 이름을 쓴다. 둘 다 비면 "판매자"로 둔다. */
export function followingName(follow: Pick<FollowedSeller, "sellerName" | "sellerNickname">) {
  return follow.sellerNickname?.trim() || follow.sellerName?.trim() || "판매자";
}

/**
 * 팔로잉 행에 넘길 판매자. `SellerRow`는 팔로잉 중이면 팔로워에 1을 더해 그리는데(목업과 같은 규칙),
 * 서버 수에는 내 팔로우가 이미 들어 있어 1을 빼서 넘긴다. 그래서 해제 직후 남는 행은 1 줄어든 수가 보인다.
 * `live`는 지금 방송 중인지(아바타의 LIVE 배지)다.
 */
export function followingRowSeller(follow: FollowedSeller, live = false) {
  return {
    id: follow.sellerId,
    name: followingName(follow),
    followers:
      follow.followerCount === undefined ? undefined : Math.max(0, follow.followerCount - 1),
    likes: follow.wishCount,
    live,
  };
}

/**
 * LIVE 배지 조회 한 번에 싣는 판매자 수. UUID가 한 명당 37자라 주소가 길어지지 않게 나눈다.
 * 판매자당 채널이 1개라 동시 LIVE도 한 명에 하나여서(BE 명세) 기본 페이지 20건에 다 들어온다.
 */
export const LIVE_BADGE_BATCH_SIZE = 20;

export function liveBadgeBatches(sellerIds: readonly string[]): string[][] {
  const batches: string[][] = [];
  for (let start = 0; start < sellerIds.length; start += LIVE_BADGE_BATCH_SIZE) {
    batches.push(sellerIds.slice(start, start + LIVE_BADGE_BATCH_SIZE));
  }
  return batches;
}

/** 방송 중인 LIVE 목록에서 판매자 ID만 모은다. `sellerId`가 없는 이전 서버 응답이면 비어 배지가 없다. */
export function liveSellerIds(pages: readonly LivePage[]): string[] {
  return pages.flatMap((page) => page.content.flatMap((live) => live.sellerId ?? []));
}

/** 목록을 이어 읽는 동안 같은 판매자가 겹쳐 와도 첫 행만 표시한다. */
export function uniqueFollowings(follows: readonly FollowedSeller[]): FollowedSeller[] {
  const ids = new Set<string>();
  return follows.filter((follow) => {
    if (ids.has(follow.sellerId)) return false;
    ids.add(follow.sellerId);
    return true;
  });
}

/**
 * 서버가 다시 읽힌 뒤에도 해제 직후 행은 새로고침 전까지 남긴다. 서버 응답을 먼저 두어,
 * 아직 응답에도 있는 행은 원래의 목록 위치를 유지한다.
 */
export function displayedFollowings(
  fetched: readonly FollowedSeller[],
  unfollowed: ReadonlyMap<string, FollowedSeller>,
): FollowedSeller[] {
  return uniqueFollowings([...fetched, ...unfollowed.values()]);
}

/** 서버 목록에서 빠진 해제 행까지 포함한 표시용 총계다. */
export function displayedFollowingTotal(
  serverTotal: number,
  fetched: readonly FollowedSeller[],
  unfollowed: ReadonlyMap<string, FollowedSeller>,
): number {
  const fetchedIds = new Set(fetched.map(({ sellerId }) => sellerId));
  const retainedCount = [...unfollowed.keys()].filter(
    (sellerId) => !fetchedIds.has(sellerId),
  ).length;
  return serverTotal + retainedCount;
}
