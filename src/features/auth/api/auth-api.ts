import { apiRequest, apiSessionRequest, refreshOnce } from "@/shared/api/client";

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

export function getMe(options?: RequestOptions) {
  return apiRequest<AuthUser>("/api/v1/members/me", {
    ...signalOptions(options),
    auth: true,
  });
}
