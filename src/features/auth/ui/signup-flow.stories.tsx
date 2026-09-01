import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SignupFlow } from "./signup-flow";

const meta = {
  title: "Features/Auth/SignupFlow",
  component: SignupFlow,
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
  },
} satisfies Meta<typeof SignupFlow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignupMethod: Story = {};

export const TermsSheet: Story = {
  args: { initialSheetOpen: true },
};
