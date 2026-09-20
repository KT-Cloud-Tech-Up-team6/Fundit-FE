"use client";

import type { ReactNode } from "react";
import { MemberAccess } from "@/providers/member-access";

export function FulfillmentAccess({ children }: { children: (memberId: string) => ReactNode }) {
  return <MemberAccess>{(member) => children(member.memberId)}</MemberAccess>;
}
