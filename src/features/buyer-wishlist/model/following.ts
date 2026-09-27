import type { FollowedSeller } from "../../../entities/seller/api/follow-api";

/* 관심 목록 팔로잉 행 이름(노션 FE 자체 판단 89). 목록 응답에는 판매자 표시명이 없어 회원 닉네임을
   먼저 쓰고, 없으면 BE가 이 목록에 함께 주는 회원 이름을 쓴다. 둘 다 비면 "판매자"로 둔다. */
export function followingName(follow: Pick<FollowedSeller, "sellerName" | "sellerNickname">) {
  return follow.sellerNickname?.trim() || follow.sellerName?.trim() || "판매자";
}
