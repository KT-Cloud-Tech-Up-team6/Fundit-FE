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

export const PhoneVerification: Story = {
  args: { initialView: "phone-form" },
};

export const VerificationCode: Story = {
  args: { initialView: "phone-code" },
};

export const VerificationMismatch: Story = {
  args: { initialView: "phone-code-error" },
};

export const VerificationExpired: Story = {
  args: { initialView: "phone-code-expired" },
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
