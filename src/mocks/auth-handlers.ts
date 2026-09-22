import { delay, http, HttpResponse } from "msw";

import type { SignupRequest, SignupTerm } from "@/features/auth/api/auth-types";

const terms: SignupTerm[] = [
  {
    code: "SERVICE_USE",
    title: "서비스 이용약관 동의",
    content: "펀딧 서비스 이용약관 전문입니다.",
    required: true,
    version: "1.0",
  },
  {
    code: "PRIVACY",
    title: "개인정보 수집·이용 동의",
    content: "개인정보 수집·이용 동의 전문입니다.",
    required: true,
    version: "1.0",
  },
  {
    code: "AGE_OVER_14",
    title: "만 14세 이상입니다",
    content: "만 14세 이상 확인 안내입니다.",
    required: true,
    version: "1.0",
  },
  {
    code: "MARKETING",
    title: "마케팅 정보 수신 동의",
    content: "마케팅 정보 수신 동의 전문입니다.",
    required: false,
    version: "1.0",
  },
  {
    code: "AI_PERSONALIZATION",
    title: "AI 개인화 서비스 활용 동의",
    content: "AI 개인화 서비스 활용 동의 전문입니다.",
    required: false,
    version: "1.0",
  },
];

let currentUser = {
  memberId: "member-demo",
  name: "펀딧 사용자",
  nickname: "펀딧러",
  phoneNumber: "01012345678",
  isSeller: false,
  isBuyer: true,
};

const error = (status: number, code: string, message: string, detail?: unknown) =>
  HttpResponse.json({ code, detail, message }, { status });

const requiredTermCodes = terms.filter((term) => term.required).map((term) => term.code);

function passwordCategoryCount(value: string) {
  return [/[A-Z]/, /[a-z]/, /\d/, /[^A-Za-z\d]/].filter((pattern) => pattern.test(value)).length;
}

export const authHandlers = [
  http.get("*/api/v1/terms", async ({ request }) => {
    const scenario = new URL(request.url).searchParams.get("scenario");
    if (scenario === "delay") await delay(2_000);
    if (scenario === "error") return error(500, "INTERNAL_ERROR", "약관을 불러오지 못했습니다.");
    return HttpResponse.json(terms);
  }),

  http.get("*/api/v1/auth/check-email", ({ request }) => {
    const email = new URL(request.url).searchParams.get("email") ?? "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return error(400, "INVALID_INPUT", "이메일 형식을 확인해 주세요.", [
        { field: "email", reason: "올바른 이메일 형식이 아닙니다." },
      ]);
    }
    return HttpResponse.json({ available: !email.startsWith("taken@") });
  }),

  http.post("*/api/v1/auth/identity-verifications", async ({ request }) => {
    const body = (await request.json()) as { identityVerificationId?: string };
    if (!body.identityVerificationId) {
      return error(400, "INVALID_INPUT", "본인인증 식별자를 확인해 주세요.");
    }
    if (body.identityVerificationId.startsWith("token-invalid")) {
      return error(401, "TOKEN_INVALID", "본인인증 결과가 만료되었습니다.");
    }
    if (body.identityVerificationId?.startsWith("dependency-failure")) {
      return error(503, "DEPENDENCY_FAILURE", "본인인증 기관 연결에 실패했습니다.");
    }
    return HttpResponse.json({
      verificationToken: `verification-${crypto.randomUUID()}`,
      expiresAt: new Date(Date.now() + 30 * 60 * 1_000).toISOString(),
    });
  }),

  http.post("*/api/v1/auth/signup", async ({ request }) => {
    const body = (await request.json()) as SignupRequest & {
      address?: Partial<{
        addressLine1: string;
        addressLine2: string;
        isDefault: boolean;
        phoneNumber: string;
        recipientName: string;
        zipcode: string;
      }>;
    };
    const email = body.email ?? "";
    const verificationToken = body.verificationToken ?? "";
    if (email.startsWith("timeout@")) return delay("infinite");
    if (email.startsWith("taken@")) {
      return error(409, "EMAIL_ALREADY_EXISTS", "이미 가입된 이메일입니다.");
    }
    if (email.startsWith("member-fail@")) {
      return error(503, "DEPENDENCY_FAILURE", "회원 정보 생성 결과를 확인하지 못했습니다.");
    }
    if (verificationToken.startsWith("expired-")) {
      return error(401, "TOKEN_INVALID", "본인인증 토큰이 만료되었습니다.");
    }
    /* 실제 백엔드(CompleteAddress)와 동일하게 all-or-nothing으로 검증한다:
       비어있거나 아예 없으면 통과, 하나라도 채웠으면 4개 필수 필드가 다 있어야 한다. */
    const address = body.address;
    const addressIsComplete =
      !address ||
      Object.keys(address).length === 0 ||
      Boolean(
        address.recipientName && address.phoneNumber && address.zipcode && address.addressLine1,
      );
    if (
      !addressIsComplete ||
      !body.email ||
      !body.nickname ||
      !body.name ||
      !body.password ||
      !body.phoneNumber ||
      !body.verificationToken ||
      !Array.isArray(body.agreedTerms) ||
      body.nickname.length > 50 ||
      body.password.length < 8 ||
      passwordCategoryCount(body.password) < 3 ||
      !requiredTermCodes.every((code) => body.agreedTerms.includes(code))
    ) {
      return error(400, "INVALID_INPUT", "입력값을 확인해 주세요.", [
        { field: "signup", reason: "필수값이 없거나 지원하지 않는 필드가 있습니다." },
      ]);
    }

    currentUser = {
      memberId: `member-${crypto.randomUUID()}`,
      name: body.name,
      nickname: body.nickname,
      phoneNumber: body.phoneNumber,
      isSeller: false,
      isBuyer: true,
    };
    const accessToken = `access-${crypto.randomUUID()}`;
    return HttpResponse.json(
      { accountId: `account-${crypto.randomUUID()}`, memberId: currentUser.memberId, accessToken },
      {
        headers: {
          "Set-Cookie":
            "refreshToken=mock-refresh-token; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth; Max-Age=1209600",
        },
      },
    );
  }),

  http.post("*/api/v1/auth/token/refresh", ({ cookies }) => {
    if (!cookies.refreshToken) {
      return error(401, "TOKEN_INVALID", "로그인 세션이 없습니다.");
    }
    return HttpResponse.json({ accessToken: `access-${crypto.randomUUID()}` });
  }),

  /* 쿠키가 없어도 200이다(BE와 동일하게 멱등). 인증 헤더를 요구하지 않는다. */
  http.post("*/api/v1/auth/logout", () =>
    HttpResponse.json(
      { message: "로그아웃되었습니다." },
      {
        headers: {
          "Set-Cookie":
            "refreshToken=; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth; Max-Age=0",
        },
      },
    ),
  ),

  http.get("*/api/v1/members/me", ({ request }) => {
    const authorization = request.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer access-")) {
      return error(401, "TOKEN_INVALID", "Access Token이 유효하지 않습니다.");
    }
    return HttpResponse.json(currentUser);
  }),
];
