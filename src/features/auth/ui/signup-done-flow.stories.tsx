import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SignupDoneFlow } from "./signup-done-flow";

const meta = {
  title: "Features/Auth/SignupDoneFlow",
  component: SignupDoneFlow,
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
  },
} satisfies Meta<typeof SignupDoneFlow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CategorySelected: Story = {
  args: { initialSelected: ["테크·가전", "푸드"], initialToastVisible: false },
};
