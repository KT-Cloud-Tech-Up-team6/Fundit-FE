import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Badge } from "./badge";

const meta = {
  title: "Shared/UI/Badge",
  component: Badge,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: {
    children: "badge",
    shape: "square",
  },
  argTypes: {
    shape: { control: "radio", options: ["square", "rounded"] },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Square: Story = {};

export const Rounded: Story = {
  args: { shape: "rounded" },
};

export const Gallery: Story = {
  render: (args) => (
    <div className="flex items-center gap-7">
      <Badge {...args} shape="square" />
      <Badge {...args} shape="rounded" />
    </div>
  ),
};
