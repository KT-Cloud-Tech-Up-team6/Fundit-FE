import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { RecoveryFlow } from "./recovery-flow";

const meta = {
  title: "Features/Auth/RecoveryFlow",
  component: RecoveryFlow,
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
  },
} satisfies Meta<typeof RecoveryFlow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FindEmail: Story = {};

export const InteractiveDemo: Story = {
  args: { demoMode: true },
};

export const MaskedEmail: Story = {
  args: { initialView: "masked-email" },
};

export const IdentityVerificationReady: Story = {
  args: { demoMode: true, initialView: "identity-ready" },
};

export const IdentityVerificationRequesting: Story = {
  args: { initialView: "identity-requesting" },
};

export const IdentityVerificationCancelled: Story = {
  args: { demoMode: true, initialView: "identity-cancelled" },
};

export const IdentityVerificationFailed: Story = {
  args: { demoMode: true, initialView: "identity-failed" },
};

export const IdentityVerificationChecking: Story = {
  args: { initialView: "identity-verifying" },
};

export const IdentityVerificationCheckFailed: Story = {
  args: { demoMode: true, initialView: "identity-verification-failed" },
};

export const FullEmail: Story = {
  args: { initialView: "full-email" },
};

export const AccountNotFound: Story = {
  args: { initialView: "not-found" },
};

export const PasswordReset: Story = {
  args: { initialView: "password-form" },
};

export const PasswordResetSent: Story = {
  args: { initialView: "password-sent" },
};
