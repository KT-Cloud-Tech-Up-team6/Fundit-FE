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
 * 새로고침 전까지 남기는 팔로잉 탭 상태(PD-9). 찜 탭을 다녀와도 유지되게 관심 목록 화면이 들고 있다.
 * `changed`는 이 화면에서 팔로우를 바꾼 판매자와 지금 팔로우 중인지, `order`는 마지막으로 바꿨을 때
 * 보이던 행 순서다.
 */
export type RetainedFollowings = {
  changed: ReadonlyMap<string, { seller: FollowedSeller; following: boolean }>;
  order: readonly string[];
};

export const noRetainedFollowings: RetainedFollowings = { changed: new Map(), order: [] };

/** 팔로우를 바꾼 판매자를 남기고, 그때 보이던 행 순서를 기억한다. */
export function retainFollowChange(
  previous: RetainedFollowings,
  displayed: readonly FollowedSeller[],
  seller: FollowedSeller,
  following: boolean,
): RetainedFollowings {
  const changed = new Map(previous.changed);
  changed.set(seller.sellerId, { seller, following });
  return { changed, order: displayed.map(({ sellerId }) => sellerId) };
}

export const isUnfollowed = (retained: RetainedFollowings, sellerId: string) =>
  retained.changed.get(sellerId)?.following === false;

/**
 * BE는 팔로우한 시각 역순이라, 다시 읽으면 해제한 행은 빠지고 다시 팔로우한 행은 맨 앞에 온다.
 * 바꾼 행은 응답에 없어도 남기고, 기억한 순서대로 두어 새로고침 전까지 제자리에 있게 한다.
 * 그 뒤에 처음 받은 행(다음 페이지)은 서버 순서대로 뒤에 붙는다.
 */
export function displayedFollowings(
  fetched: readonly FollowedSeller[],
  retained: RetainedFollowings,
): FollowedSeller[] {
  const rows = uniqueFollowings([
    ...fetched,
    ...[...retained.changed.values()].map(({ seller }) => seller),
  ]);
  const position = new Map(retained.order.map((sellerId, index) => [sellerId, index]));
  const known = rows
    .filter(({ sellerId }) => position.has(sellerId))
    .sort((a, b) => position.get(a.sellerId)! - position.get(b.sellerId)!);
  return [...known, ...rows.filter(({ sellerId }) => !position.has(sellerId))];
}

/**
 * 기억한 순서의 행 가운데 지금 목록에 없는 행이 있는지. 다시 팔로우한 행이 BE 목록 맨 앞에 끼거나 해제 뒤
 * 다시 읽으며 페이지 수가 줄면, 보이던 끝 행이 아직 받지 않은 다음 페이지로 밀린다.
 */
export function hasMissingShownRow(
  retained: RetainedFollowings,
  displayed: readonly FollowedSeller[],
): boolean {
  const shown = new Set(displayed.map(({ sellerId }) => sellerId));
  return retained.order.some((sellerId) => !shown.has(sellerId));
}

/** 서버 목록에서 빠진 해제 행까지 포함한 표시용 총계다. */
export function displayedFollowingTotal(
  serverTotal: number,
  fetched: readonly FollowedSeller[],
  retained: RetainedFollowings,
): number {
  const fetchedIds = new Set(fetched.map(({ sellerId }) => sellerId));
  const retainedCount = [...retained.changed.keys()].filter(
    (sellerId) => !fetchedIds.has(sellerId),
  ).length;
  return serverTotal + retainedCount;
}
