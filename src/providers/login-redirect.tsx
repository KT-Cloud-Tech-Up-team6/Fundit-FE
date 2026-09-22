"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/* 비로그인 화면 대신 로그인으로 보내고, 로그인 뒤 현재 화면(쿼리·해시 포함)으로 돌아오게 한다.
   replace라 뒤로가기가 이 화면과 로그인 사이를 오가지 않는다. */
export function LoginRedirect() {
  const router = useRouter();
  useEffect(() => {
    const returnTo = window.location.pathname + window.location.search + window.location.hash;
    router.replace(`/auth/login?${new URLSearchParams({ returnTo })}`);
  }, [router]);
  return <p role="status">로그인 화면으로 이동하고 있습니다.</p>;
}
