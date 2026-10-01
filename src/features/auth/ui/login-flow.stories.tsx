import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { LoginFlow } from "./login-flow";

const meta = {
  title: "Features/Auth/LoginFlow",
  component: LoginFlow,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof LoginFlow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LoginMethod: Story = {};

export const GeneralLogin: Story = {
  args: { demoMode: true, initialView: "form" },
};

export const Loading: Story = {
  args: { demoMode: true, initialSubmitting: true, initialView: "form" },
};

export const PasswordRequired: Story = {
  args: { initialError: "password-required", initialView: "form" },
};

export const CredentialsMismatch: Story = {
  args: { initialError: "credentials", initialView: "form" },
};

/* 방식 선택에서 이메일 폼으로 바뀌어도 포커스가 사라지지 않고 이메일 입력으로 옮겨진다. */
export const FocusMovesToEmail: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "이메일로 로그인" }));
    await waitFor(() => expect(canvas.getByLabelText("이메일")).toHaveFocus());
  },
};

/* 제출 중 입력이 disabled가 돼 포커스를 잃어도, 실패하면 비밀번호 입력으로 돌아온다. */
export const FocusReturnsAfterFailure: Story = {
  args: { demoMode: true, initialView: "form" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("이메일"), "a@b.co");
    await userEvent.type(canvas.getByLabelText("비밀번호"), "wrong-password");
    await userEvent.click(canvas.getByRole("button", { name: "로그인" }));
    await waitFor(() => expect(canvas.getByLabelText("비밀번호")).toHaveFocus());
    await expect(canvas.getByText("입력하신 계정 정보가 일치하지 않습니다.")).toBeVisible();
  },
};
