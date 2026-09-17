import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { TextButton } from "./text-button";

const meta = {
  title: "Shared/UI/TextButton",
  component: TextButton,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: {
    children: "text",
    variant: "underline",
  },
  argTypes: {
    variant: { control: "radio", options: ["underline", "plain"] },
  },
} satisfies Meta<typeof TextButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Plain: Story = {
  args: { variant: "plain" },
};

export const Gallery: Story = {
  render: (args) => (
    <div className="flex flex-col items-start gap-6">
      <TextButton {...args} variant="underline" />
      <TextButton {...args} showIcon={false} variant="underline" />
      <div className="flex items-center gap-2">
        <TextButton {...args} variant="plain" />
        <span className="text-border-default">|</span>
        <TextButton {...args} variant="plain" />
      </div>
    </div>
  ),
};
