import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SocialLinkFlow } from "./social-link-flow";

const meta = {
  title: "Features/Auth/SocialLinkFlow",
  component: SocialLinkFlow,
  parameters: { layout: "fullscreen", nextjs: { appDirectory: true } },
} satisfies Meta<typeof SocialLinkFlow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = { args: { initialView: "ready" } };
export const Requesting: Story = { args: { initialView: "requesting" } };
export const VerificationFailed: Story = { args: { initialView: "verification-failed" } };
export const Linking: Story = { args: { initialView: "linking" } };
export const LinkFailed: Story = { args: { initialView: "link-failed" } };
