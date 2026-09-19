import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { SignupTermsSheet } from "./signup-terms-sheet";

const requiredTermCodes = ["SERVICE_USE", "PRIVACY", "AGE_OVER_14"];
const allTermCodes = [...requiredTermCodes, "MARKETING", "AI_PERSONALIZATION"];

const meta = {
  title: "Features/Auth/SignupTermsSheet",
  component: SignupTermsSheet,
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
  args: { onAgree: fn(), onClose: fn(), open: true },
} satisfies Meta<typeof SignupTermsSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/* 미동의. `회원가입 하기`가 비활성이다. */
export const NotAgreed: Story = {};

/* 필수 3개만 동의. 전체 동의는 indeterminate, `회원가입 하기`는 활성이다. */
export const RequiredOnly: Story = {
  args: { initialCheckedIds: requiredTermCodes },
};

export const AllAgreed: Story = {
  args: { initialCheckedIds: allTermCodes },
};

/* 같은 시트의 내부 뷰다. 시트를 두 개 쌓지 않는다. */
export const TermsDetail: Story = {
  args: { initialDetailId: "SERVICE_USE" },
};
