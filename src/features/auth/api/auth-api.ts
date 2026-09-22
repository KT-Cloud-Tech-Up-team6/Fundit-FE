import { apiRequest, apiSessionRequest, refreshOnce, withAuthLock } from "@/shared/api/client";
import { authTokenStore } from "@/shared/api/auth-token-store";

import type {
  AuthResult,
  AuthUser,
  RequestOptions,
  SignupRequest,
  SignupTerm,
  SocialLoginResult,
  SocialProvider,
  SocialSignupRequest,
} from "./auth-types";

const signalOptions = (options?: RequestOptions) => ({ signal: options?.signal });

export function findEmail(
  request: { name: string; phoneNumber: string },
  options?: RequestOptions,
) {
  return apiRequest<{ maskedEmail: string | null }>("/api/v1/auth/find-email", {
    ...signalOptions(options),
    body: request,
    method: "POST",
  });
}

export function revealEmail(verificationToken: string, options?: RequestOptions) {
  return apiRequest<{ email: string }>("/api/v1/auth/find-email/reveal", {
    ...signalOptions(options),
    body: { verificationToken },
    method: "POST",
  });
}

export function requestPasswordReset(
  request: { name: string; phoneNumber: string; email: string },
  options?: RequestOptions,
) {
  return apiRequest<{ message: string }>("/api/v1/auth/reset-password", {
    ...signalOptions(options),
    body: request,
    method: "POST",
  });
}

export function confirmPasswordReset(
  request: { token: string; newPassword: string },
  options?: RequestOptions,
) {
  return apiRequest<{ message: string }>("/api/v1/auth/reset-password/confirm", {
    ...signalOptions(options),
    body: request,
    method: "POST",
  });
}

export function changePassword(
  request: { currentPassword: string; newPassword: string },
  options?: RequestOptions,
) {
  return apiRequest<{ message: string }>("/api/v1/auth/password", {
    ...signalOptions(options),
    auth: true,
    body: request,
    method: "PATCH",
  });
}

export function getTerms(options?: RequestOptions) {
  return apiRequest<SignupTerm[]>("/api/v1/terms", signalOptions(options));
}

export function checkEmail(email: string, options?: RequestOptions) {
  return apiRequest<{ available: boolean }>(
    `/api/v1/auth/check-email?email=${encodeURIComponent(email)}`,
    signalOptions(options),
  );
}

export function verifyIdentity(
  request: { identityVerificationId: string },
  options?: RequestOptions,
) {
  return apiRequest<{ expiresAt: string; verificationToken: string }>(
    "/api/v1/auth/identity-verifications",
    { ...signalOptions(options), body: request, method: "POST" },
  );
}

export function signup(request: SignupRequest, options?: RequestOptions) {
  return apiSessionRequest<AuthResult>("/api/v1/auth/signup", {
    ...signalOptions(options),
    body: request,
    method: "POST",
  });
}

export function login(request: { email: string; password: string }, options?: RequestOptions) {
  return apiSessionRequest<{ accessToken: string; mustChangePassword: boolean }>(
    "/api/v1/auth/login",
    {
      ...signalOptions(options),
      body: request,
      method: "POST",
    },
  );
}

export function loginSocial(
  request: { authorizationCode: string; provider: SocialProvider },
  options?: RequestOptions,
) {
  return apiSessionRequest<SocialLoginResult>("/api/v1/auth/login/social", {
    ...signalOptions(options),
    body: request,
    method: "POST",
  });
}

export function signupSocial(request: SocialSignupRequest, options?: RequestOptions) {
  return apiSessionRequest<AuthResult>("/api/v1/auth/signup/social", {
    ...signalOptions(options),
    body: request,
    method: "POST",
  });
}

export function linkSocial(
  request: { linkToken: string; verificationToken: string },
  options?: RequestOptions,
) {
  return apiSessionRequest<{ accessToken: string }>("/api/v1/auth/social/link", {
    ...signalOptions(options),
    body: request,
    method: "POST",
  });
}

export async function refreshAccessToken() {
  return { accessToken: await refreshOnce() };
}

/**
 * 이 기기의 Refresh Token을 서버에서 폐기한다. 인증 헤더를 붙이지 않는다 — BE는 Access Token이
 * 만료된 뒤에도 로그아웃할 수 있게 이 경로를 열어뒀고, 쿠키가 없어도 200이다.
 *
 * 쿠키를 바꾸는 요청이라 로그인·refresh와 같은 잠금으로 직렬화한다. 호출자는 이미 로컬 세션을
 * 비운 뒤이므로 여기서 실패해도 되돌릴 것이 없다.
 */
export function revokeSession(generation: string | null) {
  return withAuthLock(async () => {
    /* 잠금을 기다리는 사이 새 로그인이 끝났다면 쿠키는 이미 그 세션의 것이다.
       그대로 보내면 방금 로그인한 세션을 끊게 되므로 보내지 않는다. */
    if (authTokenStore.getSessionGeneration() !== generation) return;
    await apiRequest<{ message: string }>("/api/v1/auth/logout", { method: "POST" });
  });
}

export function getMe(options?: RequestOptions) {
  return apiRequest<AuthUser>("/api/v1/members/me", {
    ...signalOptions(options),
    auth: true,
  });
}
