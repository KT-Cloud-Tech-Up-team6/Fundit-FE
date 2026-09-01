import type { Meta, StoryObj } from "@storybook/nextjs-vite";

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

export const EmailForm: Story = {
  args: {},
};

export const EmailTaken: Story = {
  args: { initialEmailTaken: true },
};

export const PasswordForm: Story = {
  args: { initialView: "password" },
};

export const AddressForm: Story = {
  args: { initialView: "address" },
};
