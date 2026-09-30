import type { SocialProvider } from "../api/auth-types";

import { safeReturnTo } from "./auth-input";
import { saveSocialAuthSession } from "./social-auth-session";
import type { SocialAuthEntry } from "./social-auth-session";

/* 카카오: https://developers.kakao.com/docs/ko/kakaologin/rest-api (인가 코드 받기)
   구글: https://developers.google.com/identity/protocols/oauth2/web-server */
const AUTHORIZE_URL: Record<SocialProvider, string> = {
  GOOGLE: "https://accounts.google.com/o/oauth2/v2/auth",
  KAKAO: "https://kauth.kakao.com/oauth/authorize",
};

/* NEXT_PUBLIC_ 값은 정적으로 참조해야 빌드 때 번들에 들어간다. 동적 키로 읽지 않는다. */
function clientId(provider: SocialProvider) {
  return (
    (provider === "KAKAO"
      ? process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID
      : process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) || undefined
  );
}

/* 개발 모드에서 MSW를 명시적으로 켠 경우에만, client ID가 없어도 목업 인가 코드로 콜백에 바로 간다. */
function mockEnabled() {
  return process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_MSW_ENABLED === "true";
}

export function providerSlug(provider: SocialProvider) {
  return provider.toLowerCase();
}

export function parseProviderSlug(slug: string): SocialProvider | null {
  return slug === "kakao" ? "KAKAO" : slug === "google" ? "GOOGLE" : null;
}

/* BE의 KAKAO_REDIRECT_URI, GOOGLE_REDIRECT_URI 및 각 콘솔에 등록한 값과 한 글자도 달라선 안 된다. */
export function redirectPath(provider: SocialProvider) {
  return `/oauth/${providerSlug(provider)}`;
}

export function buildAuthorizeUrl({
  origin,
  provider,
  state,
}: {
  origin: string;
  provider: SocialProvider;
  state: string;
}) {
  const id = clientId(provider);
  if (!id) return null;
  const params = new URLSearchParams({
    client_id: id,
    redirect_uri: `${origin}${redirectPath(provider)}`,
    response_type: "code",
    state,
  });
  // 카카오는 scope를 생략하면 콘솔의 동의항목 설정을 따른다. 구글은 필수다.
  if (provider === "GOOGLE") params.set("scope", "openid email profile");
  return `${AUTHORIZE_URL[provider]}?${params}`;
}

export function isSocialAuthAvailable(provider: SocialProvider) {
  return Boolean(clientId(provider)) || mockEnabled();
}

export function startSocialAuth({
  agreedTerms,
  entry,
  provider,
  returnTo,
}: {
  agreedTerms: string[];
  entry: SocialAuthEntry;
  provider: SocialProvider;
  returnTo?: string;
}) {
  const state = crypto.randomUUID();
  const saved = saveSocialAuthSession({
    agreedTerms,
    entry,
    provider,
    returnTo: safeReturnTo(returnTo),
    state,
  });
  if (!saved) return false;

  const url = clientId(provider)
    ? buildAuthorizeUrl({ origin: window.location.origin, provider, state })
    : mockEnabled()
      ? `${redirectPath(provider)}?${new URLSearchParams({ code: "mock-existing", state })}`
      : null;
  if (!url) return false;
  window.location.assign(url);
  return true;
}
