import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SocialSignupFlow } from "./social-signup-flow";

const STORAGE_KEY = "fundit-auth-social-signup";
const requiredTermCodes = ["SERVICE_USE", "PRIVACY", "AGE_OVER_14"];

/* 콜백이 세션 스토리지에 남기는 가입 정보를 렌더 전에 심는다. 화면은 마운트 뒤에 이 값을 읽는다. */
function seedSession(session: Record<string, unknown> | null) {
  return () => {
    if (session === null) sessionStorage.removeItem(STORAGE_KEY);
    else
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          expiresAt: Date.now() + 10 * 60 * 1000,
          signupToken: "story-token",
          ...session,
        }),
      );
  };
}

const meta = {
  title: "Features/Auth/SocialSignupFlow",
  component: SocialSignupFlow,
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
    viewport: {
      defaultViewport: "figma390",
      options: {
        figma390: { name: "Figma 390 × 844", styles: { width: "390px", height: "844px" } },
      },
    },
  },
} satisfies Meta<typeof SocialSignupFlow>;

export default meta;
type Story = StoryObj<typeof meta>;

/* 구글: 이메일은 읽기 전용, name은 이름 칸에 채워지고 닉네임은 비어 있다. 약관은 OAuth 앞에서 받았다. */
export const Google: Story = {
  loaders: [
    seedSession({
      agreedTerms: requiredTermCodes,
      email: "social@fundit.test",
      entry: "signup",
      name: "홍길동",
      provider: "GOOGLE",
    }),
  ],
};

/* 카카오: 이메일 동의가 없어 직접 받고, name은 닉네임 칸에 채워지고 이름은 비어 있다. */
export const KakaoWithoutEmail: Story = {
  loaders: [
    seedSession({
      agreedTerms: requiredTermCodes,
      email: null,
      entry: "signup",
      name: "카카오유저",
      provider: "KAKAO",
    }),
  ],
};

/* 로그인 화면에서 진입해 미가입으로 판정됐다. 약관을 아직 받지 못해 폼 위에 약관 시트가 뜬다. */
export const TermsSheetAfterLoginEntry: Story = {
  loaders: [
    seedSession({
      agreedTerms: [],
      email: "social@fundit.test",
      entry: "login",
      name: "홍길동",
      provider: "GOOGLE",
    }),
  ],
};

/* 가입 정보가 없거나 만료됐다. 직접 열었거나 새로고침으로 토큰이 사라진 경우다. */
export const NoSession: Story = {
  loaders: [seedSession(null)],
};
