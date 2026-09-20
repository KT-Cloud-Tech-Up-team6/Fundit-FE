import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SignupVerifyFlow } from "./signup-verify-flow";

const meta = {
  title: "Features/Auth/SignupVerifyFlow",
  component: SignupVerifyFlow,
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
} satisfies Meta<typeof SignupVerifyFlow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Information: Story = {};

export const Ready: Story = {
  args: { initialView: "ready" },
};

export const Requesting: Story = {
  args: { initialView: "requesting" },
};

export const Cancelled: Story = {
  args: { initialView: "cancelled" },
};

export const Failed: Story = {
  args: { initialView: "failed" },
};

export const Verifying: Story = {
  args: { initialView: "verifying" },
};

export const VerificationFailed: Story = {
  args: { initialView: "verification-failed" },
};

export const Done: Story = {
  args: { initialView: "done" },
};
