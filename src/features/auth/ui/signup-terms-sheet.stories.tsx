import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { requiredTermIds, signupTerms } from "./signup-terms";
import { SignupTermsSheet } from "./signup-terms-sheet";

const meta = {
  title: "Features/Auth/SignupTermsSheet",
  component: SignupTermsSheet,
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
  },
  args: { onAgree: fn(), onClose: fn(), open: true },
} satisfies Meta<typeof SignupTermsSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/* 미동의. `회원가입 하기`가 비활성이다. */
export const NotAgreed: Story = {};

/* 필수 3개만 동의. 전체 동의는 indeterminate, `회원가입 하기`는 활성이다. */
export const RequiredOnly: Story = {
  args: { initialCheckedIds: requiredTermIds },
};

export const AllAgreed: Story = {
  args: { initialCheckedIds: signupTerms.map((term) => term.id) },
};

/* 같은 시트의 내부 뷰다. 시트를 두 개 쌓지 않는다. */
export const TermsDetail: Story = {
  args: { initialDetailId: "service" },
};
