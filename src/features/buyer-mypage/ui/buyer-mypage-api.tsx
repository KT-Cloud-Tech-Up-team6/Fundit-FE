"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyEmail } from "@/features/auth/api/auth-api";
import type { AuthUser } from "@/features/auth/api/auth-types";
import { MemberAccess } from "./member-access";
import { BuyerMyPage } from "./buyer-mypage";

export function BuyerMyPageApi() {
  return (
    <MemberAccess>
      {(member) => <MemberMyPage key={member.memberId} member={member} />}
    </MemberAccess>
  );
}

function MemberMyPage({ member }: { member: AuthUser }) {
  const account = useQuery({
    queryKey: ["auth-me", member.memberId],
    queryFn: ({ signal }) => getMyEmail({ signal }),
  });
  return <BuyerMyPage member={{ ...member, email: account.data?.email }} />;
}
