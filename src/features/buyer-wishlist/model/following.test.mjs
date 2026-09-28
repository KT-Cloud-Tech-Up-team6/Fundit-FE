import assert from "node:assert/strict";
import test from "node:test";
import {
  displayedFollowings,
  displayedFollowingTotal,
  followingName,
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

test("an unfollowed row stays at its fetched position and is kept after a refetch", () => {
  const seller = (sellerId) => ({ sellerId, sellerName: sellerId, createdAt: "2026-09-28" });
  const removed = seller("b");
  const unfollowed = new Map([[removed.sellerId, removed]]);

  assert.deepEqual(
    displayedFollowings([seller("a"), removed, seller("c")], unfollowed).map(
      ({ sellerId }) => sellerId,
    ),
    ["a", "b", "c"],
  );
  assert.deepEqual(
    displayedFollowings([seller("a"), seller("c")], unfollowed).map(({ sellerId }) => sellerId),
    ["a", "c", "b"],
  );
});

test("the displayed total includes rows retained until refresh", () => {
  assert.equal(displayedFollowingTotal(0, 1), 1);
  assert.equal(displayedFollowingTotal(20, 19), 20);
});
