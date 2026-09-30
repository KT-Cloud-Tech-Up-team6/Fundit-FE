import { delay, http, HttpResponse } from "msw";

import type {
  SignupRequest,
  SignupTerm,
  SocialSignupRequest,
} from "@/features/auth/api/auth-types";

import { E2E_LOGIN } from "./fixtures";

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

/* 소셜 가입에서 이미 쓴 signupToken. 목업 워커가 살아 있는 동안(페이지를 새로 열기 전까지) 유지된다. */
const consumedSignupTokens = new Set<string>();

function passwordCategoryCount(value: string) {
  return [/[A-Z]/, /[a-z]/, /\d/, /[^A-Za-z\d]/].filter((pattern) => pattern.test(value)).length;
}

/* BE `ReservedNickname`(BE PR #208)처럼 NFKC로 맞추고 공백·폭 없는 문자를 뺀 소문자 값이 예약어와 같은지 본다. */
const reservedNicknames = new Set(["판매자", "나", "ai매니저", "시청자"]);

function isReservedNickname(value: string) {
  return reservedNicknames.has(
    value
      .normalize("NFKC")
      .replace(/[\s\u200B-\u200D\u2060\uFEFF]/g, "")
      .toLowerCase(),
  );
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
    // BE처럼 가입 처리 맨 앞에서 거절해 본인인증 토큰을 쓰지 않는다.
    if (isReservedNickname(body.nickname ?? "")) {
      return error(400, "RESERVED_NICKNAME", "사용할 수 없는 닉네임입니다.");
    }
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
    /* 실제 BE는 본인인증한 이름+전화번호로 기존 계정을 찾는다. 목업은 이 번호 하나로 재현한다. */
    if (body.phoneNumber === "01000000000") {
      return error(409, "ACCOUNT_ALREADY_EXISTS", "이미 계정이 존재합니다.");
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

  /* E2E 전용: 실제 BE의 로그인 계약을 따로 재현하지 않고, 픽스처 계정 하나만 성공시킨다. */
  http.post("*/api/v1/auth/login", async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string };
    if (body.email !== E2E_LOGIN.email || body.password !== E2E_LOGIN.password) {
      return error(401, "INVALID_CREDENTIALS", "이메일 또는 비밀번호가 올바르지 않습니다.");
    }
    return HttpResponse.json(
      { accessToken: `access-${crypto.randomUUID()}`, mustChangePassword: false },
      {
        headers: {
          "Set-Cookie":
            "refreshToken=mock-refresh-token; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth; Max-Age=1209600",
        },
      },
    );
  }),

  /* 소셜 로그인 목업. 인가 코드로 BE의 세 갈래 응답(로그인·가입 필요·연동 필요)과 오류를 고른다.
     실제 제공자·client ID 없이 콜백 화면을 확인하기 위한 것이다. */
  http.post("*/api/v1/auth/login/social", async ({ request }) => {
    const { authorizationCode, provider } = (await request.json()) as {
      authorizationCode?: string;
      provider?: string;
    };
    switch (authorizationCode) {
      case "mock-existing":
      case "mock-must-change-password":
        return HttpResponse.json(
          {
            accessToken: `access-${crypto.randomUUID()}`,
            mustChangePassword: authorizationCode === "mock-must-change-password",
            needsLink: false,
            needsSignup: false,
          },
          {
            headers: {
              "Set-Cookie":
                "refreshToken=mock-refresh-token; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth; Max-Age=1209600",
            },
          },
        );
      case "mock-signup":
      // 카카오는 이메일 동의가 선택이라 email이 없을 수 있다. name은 카카오에서는 닉네임이다.
      case "mock-signup-no-email":
      // 가입 요청 단계의 실패 갈래(만료, 서버 실패, 이메일 충돌)를 고르기 위한 토큰이다.
      case "mock-signup-expired":
      case "mock-signup-broken":
      case "mock-signup-conflict":
        return HttpResponse.json({
          ...(authorizationCode === "mock-signup-no-email" ? {} : { email: "social@fundit.test" }),
          name: authorizationCode === "mock-signup-no-email" ? "카카오유저" : "소셜 사용자",
          needsLink: false,
          needsSignup: true,
          provider,
          signupToken: {
            "mock-signup": "mock-signup-token",
            "mock-signup-broken": "mock-broken-token",
            "mock-signup-conflict": "mock-conflict-token",
            "mock-signup-expired": "mock-expired-token",
            "mock-signup-no-email": "mock-signup-token",
          }[authorizationCode],
        });
      case "mock-link":
      case "mock-link-forbidden":
      case "mock-link-expired":
      case "mock-link-locked":
      case "mock-link-unavailable":
        return HttpResponse.json({
          linkToken: `mock-link-token-${authorizationCode.replace("mock-link", "").replace(/^$/, "ok")}`,
          needsLink: true,
          needsSignup: false,
          provider,
        });
      case "mock-exists":
        return error(409, "SOCIAL_ACCOUNT_EXISTS", "이미 KAKAO 소셜 로그인 계정이 존재합니다.", {
          provider: "KAKAO",
        });
      case "mock-locked":
        return error(423, "ACCOUNT_LOCKED", "계정이 잠겨 있습니다.");
      default:
        return error(503, "DEPENDENCY_FAILURE", "외부 서비스 호출에 실패했습니다.");
    }
  }),

  /* social/link은 linkToken을 검증 전에 소비하는 현재 BE 계약을 따른다. E2E에서는 토큰 접미사로
     각 사용자 안내를 재현한다. */
  http.post("*/api/v1/auth/social/link", async ({ request }) => {
    const body = (await request.json()) as { linkToken?: string; verificationToken?: string };
    if (!body.verificationToken)
      return error(401, "TOKEN_INVALID", "본인인증 결과가 만료되었습니다.");
    if (body.linkToken?.endsWith("-forbidden"))
      return error(403, "IDENTITY_MISMATCH", "기존 계정의 본인 확인 정보와 일치하지 않습니다.");
    if (body.linkToken?.endsWith("-expired"))
      return error(401, "TOKEN_INVALID", "연동 토큰이 만료되었습니다.");
    if (body.linkToken?.endsWith("-locked"))
      return error(423, "ACCOUNT_LOCKED", "계정이 잠겨 있습니다.");
    if (body.linkToken?.endsWith("-unavailable"))
      return error(503, "DEPENDENCY_FAILURE", "연동 서비스를 이용할 수 없습니다.");
    if (body.linkToken !== "mock-link-token-ok")
      return error(401, "TOKEN_INVALID", "연동 토큰이 유효하지 않습니다.");
    return HttpResponse.json(
      { accessToken: `access-${crypto.randomUUID()}` },
      {
        headers: {
          "Set-Cookie":
            "refreshToken=mock-refresh-token; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth; Max-Age=1209600",
        },
      },
    );
  }),

  /* 소셜 가입 목업. BE처럼 토큰을 검증보다 먼저 소비하고, member-service 실패(필수 약관 누락 등)는
     원인을 구분할 수 없는 503으로 내려 준다. 본인인증은 없다. */
  http.post("*/api/v1/auth/signup/social", async ({ request }) => {
    const body = (await request.json()) as Partial<SocialSignupRequest>;
    const token = body.signupToken;
    // 예약어 닉네임은 BE처럼 토큰을 쓰기 전에 거절한다. 같은 토큰으로 닉네임만 고쳐 다시 보낼 수 있다.
    if (isReservedNickname(body.nickname ?? "")) {
      return error(400, "RESERVED_NICKNAME", "사용할 수 없는 닉네임입니다.");
    }
    if (
      !token?.startsWith("mock-") ||
      token === "mock-expired-token" ||
      consumedSignupTokens.has(token)
    ) {
      return error(401, "TOKEN_EXPIRED", "Access Token 만료");
    }
    // BE처럼 이후 검증에서 실패해도 토큰은 이미 소비된 것으로 본다. 같은 토큰으로 다시 보내면 401이다.
    consumedSignupTokens.add(token);
    if (!body.name?.trim() || !body.nickname?.trim() || !body.phoneNumber?.trim()) {
      return error(400, "INVALID_INPUT", "필수 항목이 비어 있습니다.");
    }
    if (!body.agreedTerms?.length) {
      return error(400, "INVALID_INPUT", "필수 항목이 비어 있습니다.");
    }
    if (body.signupToken === "mock-broken-token") {
      return error(503, "DEPENDENCY_FAILURE", "외부 서비스(Auth, Redis 등) 호출 실패");
    }
    if (body.signupToken === "mock-conflict-token" || body.email?.startsWith("taken@")) {
      return error(409, "EMAIL_ALREADY_EXISTS", "이미 가입된 이메일입니다.");
    }
    if (!requiredTermCodes.every((code) => body.agreedTerms?.includes(code))) {
      return error(503, "DEPENDENCY_FAILURE", "외부 서비스(Auth, Redis 등) 호출 실패");
    }
    currentUser = { ...currentUser, name: body.name.trim(), nickname: body.nickname.trim() };
    return HttpResponse.json(
      {
        accessToken: `access-${crypto.randomUUID()}`,
        accountId: crypto.randomUUID(),
        memberId: crypto.randomUUID(),
      },
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
