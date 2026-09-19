import { apiRequest, refreshOnce } from "@/shared/api/client";

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
  return apiRequest<AuthResult>("/api/v1/auth/signup", {
    ...signalOptions(options),
    body: request,
    method: "POST",
  });
}

export function login(request: { email: string; password: string }, options?: RequestOptions) {
  return apiRequest<{ accessToken: string; mustChangePassword: boolean }>("/api/v1/auth/login", {
    ...signalOptions(options),
    body: request,
    method: "POST",
  });
}

export function loginSocial(
  request: { authorizationCode: string; provider: SocialProvider },
  options?: RequestOptions,
) {
  return apiRequest<SocialLoginResult>("/api/v1/auth/login/social", {
    ...signalOptions(options),
    body: request,
    method: "POST",
  });
}

export function signupSocial(request: SocialSignupRequest, options?: RequestOptions) {
  return apiRequest<AuthResult>("/api/v1/auth/signup/social", {
    ...signalOptions(options),
    body: request,
    method: "POST",
  });
}

export function linkSocial(
  request: { linkToken: string; verificationToken: string },
  options?: RequestOptions,
) {
  return apiRequest<{ accessToken: string }>("/api/v1/auth/social/link", {
    ...signalOptions(options),
    body: request,
    method: "POST",
  });
}

export async function refreshAccessToken() {
  return { accessToken: await refreshOnce() };
}

export function getMe(options?: RequestOptions) {
  return apiRequest<AuthUser>("/api/v1/members/me", {
    ...signalOptions(options),
    auth: true,
  });
}
