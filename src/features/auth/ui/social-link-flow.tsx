"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { startTransition, useEffect, useRef, useState } from "react";

import { linkSocial, verifyIdentity } from "@/features/auth/api/auth-api";
import { requestIdentityVerification } from "@/features/auth/api/portone-identity-adapter";
import {
  clearSocialLinkSession,
  getSocialLinkSession,
  saveSocialLinkSession,
} from "@/features/auth/model/social-link-session";
import type { SocialLinkSession } from "@/features/auth/model/social-link-session";
import { startSocialAuth } from "@/features/auth/model/oauth-authorize";
import { useAuth } from "@/providers/auth-provider";
import { isApiError } from "@/shared/api/api-error";

import { AuthButton } from "./auth-form-controls";
import { AuthIdentityVerification } from "./auth-identity-verification";
import type { IdentityStatus } from "./auth-identity-verification";
import { AuthBottomAction, AuthScreen, AuthTitle } from "./auth-screen";

type LinkView = IdentityStatus | "linking" | "link-failed" | "missing";

const descriptionByStatus: Record<Exclude<IdentityStatus, "ready">, string> = {
  requesting: "열린 인증 창에서\n본인인증을 완료해 주세요.",
  cancelled: "소셜 계정을 연동하려면\n본인인증을 다시 진행해 주세요.",
  failed: "인증 과정에서 문제가 발생했습니다.\n잠시 후 다시 시도해 주세요.",
  verifying: "인증 결과를 안전하게 확인 중입니다.\n잠시만 기다려 주세요.",
  "verification-failed":
    "인증 결과가 만료되었거나 유효하지 않습니다.\n본인인증을 다시 진행해 주세요.",
};

function linkFailureMessage(error: unknown) {
  if (!isApiError(error)) return "연동 요청을 완료하지 못했습니다.";
  switch (error.status) {
    case 403:
      return "본인 확인 정보가 기존 계정과 일치하지 않습니다.";
    case 401:
      return "연동 정보가 만료되었거나 유효하지 않습니다.";
    case 423:
      return "계정이 일시적으로 잠겼습니다. 잠시 후 다시 시도해 주세요.";
    case 503:
      return "연동 서비스를 일시적으로 이용할 수 없습니다.";
    default:
      return "연동 요청을 완료하지 못했습니다.";
  }
}

function demoSession(): SocialLinkSession {
  return {
    expiresAt: Date.now() + 60_000,
    linkToken: "story-link-token",
    provider: "KAKAO",
    returnTo: "/",
  };
}

type SocialLinkFlowProps = {
  /** Storybook에서 각 상태를 고정해 확인할 때만 사용한다. */
  initialView?: LinkView;
};

export function SocialLinkFlow({ initialView }: SocialLinkFlowProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authenticate } = useAuth();
  const [session, setSession] = useState<SocialLinkSession | null>(() =>
    initialView ? demoSession() : null,
  );
  const [view, setView] = useState<LinkView>(initialView ?? "ready");
  const [linkError, setLinkError] = useState<unknown>(null);
  const startedRef = useRef(false);
  const mountedRef = useRef(false);
  const activeRunRef = useRef<AbortController | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      /* 화면 이탈 뒤에는 아직 시작되지 않은 linkSocial·authenticate·이동을 막는다.
         StrictMode의 개발용 effect 재실행 시점에는 실행 중인 요청이 없으므로 영향을 주지 않는다. */
      activeRunRef.current?.abort();
      mountedRef.current = false;
    };
  }, []);

  function beginRun() {
    activeRunRef.current?.abort();
    const controller = new AbortController();
    activeRunRef.current = controller;
    return controller;
  }

  function abortRun() {
    activeRunRef.current?.abort();
  }

  useEffect(() => {
    if (initialView || startedRef.current) return;
    startedRef.current = true;
    const restored = getSocialLinkSession();
    if (!restored) {
      startTransition(() => setView("missing"));
      return;
    }
    startTransition(() => setSession(restored));

    const identityVerificationId = searchParams.get("identityVerificationId");
    const failureCode = searchParams.get("code");
    // PortOne의 결과 식별자도 주소/히스토리에 오래 남기지 않는다. linkToken은 처음부터 URL에 없다.
    window.history.replaceState(window.history.state, "", window.location.pathname);
    if (failureCode) {
      startTransition(() => setView("cancelled"));
      return;
    }
    if (!identityVerificationId) return;
    /* URL의 값만 믿으면 이전 모바일 콜백이 현재의 1회용 linkToken을 소비할 수 있다. */
    if (restored.identityVerificationId !== identityVerificationId) {
      startTransition(() => setView("verification-failed"));
      return;
    }
    /* StrictMode는 초기 effect를 한 번 정리한 뒤 다시 연결한다. 그 뒤에 시작해야 개발 모드의
       cleanup이 모바일 콜백 검증을 취소하지 않는다. 실제 화면 이탈 뒤에는 mountedRef가 막는다. */
    queueMicrotask(() => {
      if (mountedRef.current) void verifyAndLink(restored, identityVerificationId);
    });
    // 콜백은 마운트마다 한 번만 처리한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function verifyAndLink(activeSession: SocialLinkSession, identityVerificationId: string) {
    const controller = beginRun();
    const current = () => activeRunRef.current === controller && !controller.signal.aborted;
    let linking = false;
    try {
      setView("verifying");
      const verification = await verifyIdentity(
        { identityVerificationId },
        { signal: controller.signal },
      );
      if (!current()) return;
      setView("linking");
      linking = true;
      const linked = await linkSocial(
        {
          linkToken: activeSession.linkToken,
          verificationToken: verification.verificationToken,
        },
        { signal: controller.signal },
      );
      if (!current()) return;
      clearSocialLinkSession();
      await authenticate(linked.accessToken);
      if (current()) router.replace(activeSession.returnTo);
    } catch (error) {
      if (!current()) return;
      // linkSocial까지 도달했다면 BE는 검증 전에 linkToken을 소비한다. 같은 토큰 재시도는 하지 않는다.
      if (linking) setLinkError(error);
      setView(linking ? "link-failed" : "verification-failed");
    }
  }

  async function startVerification() {
    if (!session) return;
    const controller = beginRun();
    const current = () => activeRunRef.current === controller && !controller.signal.aborted;
    const identityVerificationId = crypto.randomUUID();
    const pendingSession = { ...session, identityVerificationId };
    setView("requesting");
    /* 리다이렉트 전에 기대값을 저장한다. 저장할 수 없으면 콜백 상관관계도 보장할 수 없다. */
    if (!saveSocialLinkSession(pendingSession)) {
      setView("failed");
      return;
    }
    setSession(pendingSession);
    try {
      const result = await requestIdentityVerification(
        {},
        {
          identityVerificationId,
          redirectUrl: `${window.location.origin}/auth/social/link`,
        },
      );
      if (!current()) return;
      if (result.status === "cancelled") return setView("cancelled");
      await verifyAndLink(pendingSession, result.identityVerificationId);
    } catch {
      if (current()) setView("failed");
    }
  }

  function restartOAuth() {
    abortRun();
    if (!session) return router.replace("/auth/login");
    clearSocialLinkSession();
    if (
      !startSocialAuth({
        agreedTerms: [],
        entry: "login",
        provider: session.provider,
        returnTo: session.returnTo,
      })
    ) {
      router.replace("/auth/login");
    }
  }

  if (view === "missing") {
    return (
      <AuthScreen withHeader={false}>
        <AuthTitle>연동 정보를\n확인하지 못했어요</AuthTitle>
        <p className="text-body-m text-text-secondary mt-4 whitespace-pre-line" role="alert">
          {
            "연동 정보가 만료되었거나 유효하지 않습니다.\n소셜 로그인을 처음부터 다시 시작해 주세요."
          }
        </p>
        <AuthBottomAction>
          <AuthButton onClick={() => router.replace("/auth/login")}>로그인으로 가기</AuthButton>
        </AuthBottomAction>
      </AuthScreen>
    );
  }

  if (view === "link-failed") {
    return (
      <AuthScreen withHeader={false}>
        <AuthTitle>소셜 계정을\n연동하지 못했어요</AuthTitle>
        <p className="text-body-m text-text-secondary mt-4 whitespace-pre-line" role="alert">
          {`${linkFailureMessage(linkError)}\n보안을 위해 소셜 로그인을 처음부터 다시 시작해 주세요.`}
        </p>
        <AuthBottomAction>
          <AuthButton onClick={restartOAuth}>소셜 로그인 다시 시작</AuthButton>
        </AuthBottomAction>
      </AuthScreen>
    );
  }

  if (view === "linking") {
    return (
      <AuthScreen withHeader={false}>
        <AuthIdentityVerification
          description="본인 확인을 마쳐 소셜 계정을 안전하게 연동하고 있어요."
          onAction={() => undefined}
          status="verifying"
          statusText="소셜 계정을 연동하고 있습니다."
        />
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      onBack={() => {
        abortRun();
        router.replace("/auth/login");
      }}
    >
      <AuthIdentityVerification
        description={
          view === "ready"
            ? "기존 이메일 계정과 소셜 계정을 연결하려면\n휴대폰 본인인증이 필요해요."
            : descriptionByStatus[view]
        }
        onAction={() => void startVerification()}
        status={view}
      />
    </AuthScreen>
  );
}
