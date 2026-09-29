import assert from "node:assert/strict";
import test from "node:test";
import {
  displayedFollowings,
  displayedFollowingTotal,
  followingName,
  followingRowSeller,
  hasMissingShownRow,
  isUnfollowed,
  liveBadgeBatches,
  liveSellerIds,
  noRetainedFollowings,
  retainFollowChange,
  uniqueFollowings,
} from "./following.ts";

test("the following row prefers the nickname", () => {
  assert.equal(followingName({ sellerName: "홍길동", sellerNickname: "길동 공방" }), "길동 공방");
});

test("the following row falls back to the member name when the nickname is missing or blank", () => {
  assert.equal(followingName({ sellerName: "홍길동" }), "홍길동");
  assert.equal(followingName({ sellerName: " 홍길동 ", sellerNickname: "  " }), "홍길동");
});

test("the following row uses a generic label when both names are missing", () => {
  assert.equal(followingName({}), "판매자");
});

test("the infinite list keeps one row when pages overlap", () => {
  const seller = (sellerId) => ({ sellerId, sellerName: sellerId, createdAt: "2026-09-28" });
  assert.deepEqual(
    uniqueFollowings([seller("a"), seller("b"), seller("b"), seller("c")]).map(
      ({ sellerId }) => sellerId,
    ),
    ["a", "b", "c"],
  );
});

test("unfollowed and refollowed rows keep their place until refresh", () => {
  const seller = (sellerId) => ({ sellerId, sellerName: sellerId, createdAt: "2026-09-28" });
  const ids = (rows) => rows.map(({ sellerId }) => sellerId);
  const [a, b, c, d] = ["a", "b", "c", "d"].map(seller);

  // 해제한 행은 다시 읽은 응답에서 빠져도 제자리에 남고, 처음 받은 행(d)은 뒤에 붙는다.
  let retained = retainFollowChange(noRetainedFollowings, [a, b, c], b, false);
  assert.equal(isUnfollowed(retained, "b"), true);
  assert.deepEqual(ids(displayedFollowings([a, b, c], retained)), ["a", "b", "c"]);
  assert.deepEqual(ids(displayedFollowings([a, c, d], retained)), ["a", "b", "c", "d"]);

  // 이어서 해제한 행도 제자리다.
  retained = retainFollowChange(retained, displayedFollowings([a, c, d], retained), c, false);
  assert.deepEqual(ids(displayedFollowings([a, d], retained)), ["a", "b", "c", "d"]);

  // 다시 팔로우하면 BE가 맨 앞(팔로우 시각 역순)에 주지만 제자리에 두고, 다시 읽기 전에도 행이 남는다.
  retained = retainFollowChange(retained, displayedFollowings([a, d], retained), b, true);
  assert.equal(isUnfollowed(retained, "b"), false);
  assert.deepEqual(ids(displayedFollowings([a, d], retained)), ["a", "b", "c", "d"]);
  assert.deepEqual(ids(displayedFollowings([b, a, d], retained)), ["a", "b", "c", "d"]);
});

test("a shown row pushed to the next page is reported as missing", () => {
  const seller = (sellerId) => ({ sellerId, sellerName: sellerId, createdAt: "2026-09-28" });
  const [a, b, c] = ["a", "b", "c"].map(seller);
  const retained = retainFollowChange(noRetainedFollowings, [a, b, c], a, true);

  assert.equal(hasMissingShownRow(retained, displayedFollowings([a, b, c], retained)), false);
  // 다시 팔로우한 a가 맨 앞에 끼어 c가 받지 않은 다음 페이지로 밀렸다.
  assert.equal(hasMissingShownRow(retained, displayedFollowings([a, b], retained)), true);
  assert.equal(hasMissingShownRow(noRetainedFollowings, [a]), false);
});

test("the displayed total includes rows retained until refresh", () => {
  const seller = (sellerId) => ({ sellerId, sellerName: sellerId, createdAt: "2026-09-28" });
  const removed = seller("a");
  const retained = retainFollowChange(noRetainedFollowings, [removed, seller("b")], removed, false);

  assert.equal(displayedFollowingTotal(39, [seller("b")], retained), 40);
  assert.equal(displayedFollowingTotal(40, [removed, seller("b")], retained), 40);
});

test("the following row passes the server counts without my own follow", () => {
  const row = followingRowSeller({
    sellerId: "a",
    sellerNickname: "길동 공방",
    followerCount: 12,
    wishCount: 3,
    createdAt: "2026-09-28",
  });
  // SellerRow adds 1 back while following, so a followed row shows 12 and an unfollowed one 11.
  assert.deepEqual(row, { id: "a", name: "길동 공방", followers: 11, likes: 3, live: false });
  assert.equal(followingRowSeller({ sellerId: "b", followerCount: 0, createdAt: "" }).followers, 0);
});

test("the following row leaves the counts out when an older server omits them", () => {
  const row = followingRowSeller({ sellerId: "a", sellerName: "홍길동", createdAt: "2026-09-28" });
  assert.equal(row.followers, undefined);
  assert.equal(row.likes, undefined);
});

test("the LIVE badge query sends at most 20 sellers per request", () => {
  const ids = Array.from({ length: 45 }, (_, index) => `seller-${index}`);
  const batches = liveBadgeBatches(ids);
  assert.deepEqual(
    batches.map((batch) => batch.length),
    [20, 20, 5],
  );
  assert.deepEqual(batches.flat(), ids);
  assert.deepEqual(liveBadgeBatches([]), []);
});

test("the LIVE badge marks only sellers returned by the LIVE list", () => {
  const page = (content) => ({
    content,
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 1,
    hasNext: false,
  });
  const live = (liveId, sellerId) => ({
    liveId,
    status: "LIVE",
    projectId: "p",
    likeCount: 0,
    createdAt: "",
    sellerId,
  });
  assert.deepEqual(liveSellerIds([page([live("l1", "a")]), page([live("l2", "c")])]), ["a", "c"]);
  // A server without BE PR #185 omits sellerId, so no row gets the badge.
  assert.deepEqual(liveSellerIds([page([live("l1", undefined)])]), []);
});
