import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SignupVerifyFlow } from "./signup-verify-flow";

const meta = {
  title: "Features/Auth/SignupVerifyFlow",
  component: SignupVerifyFlow,
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
  },
} satisfies Meta<typeof SignupVerifyFlow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {
  args: { demoMode: true },
};

export const Requesting: Story = {
  args: { initialView: "requesting" },
};

export const Cancelled: Story = {
  args: { demoMode: true, initialView: "cancelled" },
};

export const Failed: Story = {
  args: { demoMode: true, initialView: "failed" },
};

export const Verifying: Story = {
  args: { initialView: "verifying" },
};

export const VerificationFailed: Story = {
  args: { demoMode: true, initialView: "verification-failed" },
};

export const Done: Story = {
  args: { initialView: "done" },
};
