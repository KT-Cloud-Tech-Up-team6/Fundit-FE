import PortOne from "@portone/browser-sdk/v2";

import type { IdentityDraft } from "./auth-types";

export type IdentityVerificationResult =
  { identityVerificationId: string; status: "success" } | { status: "cancelled" };

type RequestOptions = {
  /* 주어지면 모바일 등 팝업을 못 쓰는 환경에서 전체 페이지 리다이렉트로 진행될 수 있다.
     실제 팝업/리다이렉트 분기는 PortOne SDK와 채널(PG)이 기기에 따라 결정한다. */
  redirectUrl?: string;
};

const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY;

function isNarrowViewport() {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
}

export async function requestIdentityVerification(
  draft: IdentityDraft,
  options?: RequestOptions,
): Promise<IdentityVerificationResult> {
  const identityVerificationId = crypto.randomUUID();

  if (!storeId || !channelKey) {
    // ponytail: 실제 PortOne Store ID와 Channel Key가 생기면 개발 시뮬레이션 대신 SDK 결과를 사용한다.
    if (options?.redirectUrl && isNarrowViewport()) {
      // 좁은 화면에서는 실제 모바일 리다이렉트처럼 콜백 URL로 이동시켜 그 경로도 테스트할 수 있게 한다.
      const url = new URL(options.redirectUrl, window.location.origin);
      url.searchParams.set("identityVerificationId", identityVerificationId);
      window.location.href = url.toString();
      return new Promise(() => {
        /* 페이지 이동으로 이 Promise는 더 이상 관찰되지 않는다. */
      });
    }
    await new Promise((resolve) => setTimeout(resolve, 650));
    return { identityVerificationId, status: "success" };
  }

  const [birthYear, birthMonth, birthDay] = draft.birthDate.split("-");
  const response = await PortOne.requestIdentityVerification({
    channelKey,
    customer: {
      birthDay,
      birthMonth,
      birthYear,
      fullName: draft.name,
      phoneNumber: draft.phoneNumber,
    },
    identityVerificationId,
    redirectUrl: options?.redirectUrl,
    storeId,
  });

  if (!response) return { status: "cancelled" };
  if (response.code) {
    // PortOne이 돌려준 원인은 화면에 노출하지 않지만, 콘솔에는 남겨 실제 오류 코드를 확인할 수 있게 한다.
    console.error("[PortOne] 본인인증 실패", {
      channelKey,
      code: response.code,
      message: response.message,
      pgCode: response.pgCode,
      pgMessage: response.pgMessage,
      storeId,
    });
    throw new Error(response.message ?? "본인인증 요청에 실패했습니다.");
  }
  return { identityVerificationId: response.identityVerificationId, status: "success" };
}
