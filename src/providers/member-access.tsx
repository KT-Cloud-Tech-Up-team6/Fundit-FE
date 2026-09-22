"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/providers/auth-provider";
import { LoginRedirect } from "@/providers/login-redirect";
import type { AuthUser } from "@/features/auth/api/auth-types";

export function MemberAccess({ children }: { children: (member: AuthUser) => ReactNode }) {
  const { state, authenticate } = useAuth();
  if (state.status === "checking") return <p role="status">회원 정보를 확인하고 있습니다.</p>;
  if (state.status === "guest") return <LoginRedirect />;
  if (!state.user)
    return (
      <p role="alert">
        회원 정보를 불러오지 못했습니다.{" "}
        <button onClick={() => void authenticate(state.accessToken)}>다시 시도</button>
      </p>
    );
  return children(state.user);
}
