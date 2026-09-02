import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { SignupProfileFlow } from "./signup-profile-flow";

const meta = {
  title: "Features/Auth/SignupProfileFlow",
  component: SignupProfileFlow,
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
  },
} satisfies Meta<typeof SignupProfileFlow>;

export default meta;
type Story = StoryObj<typeof meta>;

const VALID_PASSWORD = "fundit1234";

export const EmailForm: Story = {
  args: {},
};

export const EmailTaken: Story = {
  args: { initialEmailTaken: true },
};

/* 도메인 선택·직접 입력과 비밀번호 규칙은 "입력에 따라 실시간으로 바뀌는" 상태다.
   초기 상태 props로 결과만 심으면 전환 자체가 빠지므로 play로 입력을 재생한다. */
export const EmailDomainSelected: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText("이메일 아이디"), "fundit");
    await userEvent.selectOptions(canvas.getByLabelText("이메일 도메인"), "@gmail.com");

    await expect(canvas.getByRole("button", { name: "다음" })).toBeEnabled();
  },
};

export const EmailCustomDomain: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText("이메일 아이디"), "fundit");
    await userEvent.selectOptions(canvas.getByLabelText("이메일 도메인"), "직접 입력");
    /* select가 텍스트 입력으로 바뀐다. */
    await userEvent.type(canvas.getByLabelText("이메일 도메인 직접 입력"), "@fundit.dev");
  },
};

/* 규칙 3개 모두 미충족. */
export const PasswordForm: Story = {
  args: { initialView: "password" },
};

/* 규칙 3개 충족, 확인 입력은 비어 있어 일치 항목만 미충족이다. */
export const PasswordRulesMet: Story = {
  args: { initialView: "password" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText("비밀번호"), VALID_PASSWORD);

    await expect(canvas.getByRole("button", { name: "다음" })).toBeDisabled();
  },
};

export const PasswordMismatch: Story = {
  args: { initialView: "password" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText("비밀번호"), VALID_PASSWORD);
    await userEvent.type(canvas.getByLabelText("비밀번호 확인"), "fundit9999");

    await expect(canvas.getByRole("button", { name: "다음" })).toBeDisabled();
  },
};

export const PasswordMatched: Story = {
  args: { initialView: "password" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText("비밀번호"), VALID_PASSWORD);
    await userEvent.type(canvas.getByLabelText("비밀번호 확인"), VALID_PASSWORD);

    await expect(canvas.getByRole("button", { name: "다음" })).toBeEnabled();
  },
};

export const AddressForm: Story = {
  args: { initialView: "address" },
};
