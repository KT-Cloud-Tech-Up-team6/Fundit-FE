"use client";

import { MemberAccess } from "./member-access";
import { BuyerMyPage } from "./buyer-mypage";

export function BuyerMyPageApi() {
  return <MemberAccess>{(member) => <BuyerMyPage member={member} />}</MemberAccess>;
}
