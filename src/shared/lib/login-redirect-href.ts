/** 비로그인 사용자를 로그인으로 보낼 때 쓰는 URL. 로그인 뒤 돌아올 곳(returnTo)을 쿼리로 싣는다. */
export function loginRedirectHref(returnTo: string) {
  return `/auth/login?${new URLSearchParams({ returnTo })}`;
}
