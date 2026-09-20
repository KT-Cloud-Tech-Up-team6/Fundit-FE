"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/providers/auth-provider";
import type { AuthUser } from "@/features/auth/api/auth-types";

export function MemberAccess({ children }: { children: (member: AuthUser) => ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { state, authenticate } = useAuth();
  if (state.status === "checking") return <p role="status">회원 정보를 확인하고 있습니다.</p>;
  if (state.status === "guest")
    return (
      <p className="p-5">
        로그인이 필요합니다.{" "}
        <Link
          href={{ pathname: "/auth/login", query: { returnTo: pathname } }}
          className="underline"
          onNavigate={(event) => {
            event.preventDefault();
            const returnTo =
              window.location.pathname + window.location.search + window.location.hash;
            router.push(`/auth/login?${new URLSearchParams({ returnTo })}`);
          }}
        >
          로그인
        </Link>
      </p>
    );
  if (!state.user)
    return (
      <p role="alert">
        회원 정보를 불러오지 못했습니다.{" "}
        <button onClick={() => void authenticate(state.accessToken)}>다시 시도</button>
      </p>
    );
  return children(state.user);
}
