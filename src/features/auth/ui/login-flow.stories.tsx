import type { Meta, StoryObj } from "@storybook/nextjs-vite";

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
