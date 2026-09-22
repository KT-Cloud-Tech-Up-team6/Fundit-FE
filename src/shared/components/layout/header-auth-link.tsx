"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { useAuth } from "@/providers/auth-provider";
import { loginRedirectHref } from "@/shared/lib/login-redirect-href";
import { TextLink, textButtonNavigationClasses } from "@/shared/components/ui/text-button";

function subscribeToHashChange(callback: () => void) {
  window.addEventListener("hashchange", callback);
  window.addEventListener("popstate", callback);
  return () => {
    window.removeEventListener("hashchange", callback);
    window.removeEventListener("popstate", callback);
  };
}

function getHash() {
  return window.location.hash;
}

function getServerHash() {
  return "";
}

/* Figma header(2044:45751)의 text_button_underline: 미로그인 "로그인하기"·로그인 "로그아웃".
   판매자/소비자 헤더 둘 다 같은 자리·문구라 공유한다. */
export function HeaderAuthLink() {
  const { logout, state } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  /* 해시는 서버에 전달되지 않아 usePathname·useSearchParams로는 못 얻는다. LoginRedirect(순수
     클라이언트 리다이렉트)와 달리 이건 SSR되는 <Link>라, useSyncExternalStore로 읽어 첫 렌더는
     해시 없이 내보내고(서버 스냅샷 "") 하이드레이션 뒤에만 채워 불일치를 피한다.
     ponytail: 같은 페이지 안에서 pushState로만 바뀌는 해시(예: 앵커 Link 클릭)는 hashchange도
     popstate도 안 터져 못 잡는다 — pathname·searchParams가 바뀌는 일반적인 이동에서는 리렌더
     때마다 다시 읽히니 문제 없고, 이 좁은 경우만 남는다. 실제로 문제가 되면 history.pushState
     패치로 넓힌다. */
  const hash = useSyncExternalStore(subscribeToHashChange, getHash, getServerHash);
  const [loggingOut, setLoggingOut] = useState(false);

  if (state.status === "checking") return null;

  if (state.status === "guest") {
    const query = searchParams.toString();
    const returnTo = `${pathname}${query ? `?${query}` : ""}${hash}`;
    return (
      <TextLink className="underline" href={loginRedirectHref(returnTo)}>
        로그인하기
      </TextLink>
    );
  }

  return (
    <button
      type="button"
      disabled={loggingOut}
      aria-busy={loggingOut}
      className={`${textButtonNavigationClasses} underline`}
      onClick={() => {
        setLoggingOut(true);
        logout();
      }}
    >
      로그아웃
    </button>
  );
}
