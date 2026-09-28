import type { FollowedSeller } from "../../../entities/seller/api/follow-api";

/* 관심 목록 팔로잉 행 이름(노션 FE 자체 판단 89). 목록 응답에는 판매자 표시명이 없어 회원 닉네임을
   먼저 쓰고, 없으면 BE가 이 목록에 함께 주는 회원 이름을 쓴다. 둘 다 비면 "판매자"로 둔다. */
export function followingName(follow: Pick<FollowedSeller, "sellerName" | "sellerNickname">) {
  return follow.sellerNickname?.trim() || follow.sellerName?.trim() || "판매자";
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

/** 화면에 남겨 둔 해제 행까지 포함한 표시용 총계다. */
export function displayedFollowingTotal(serverTotal: number, displayedCount: number): number {
  return Math.max(serverTotal, displayedCount);
}
