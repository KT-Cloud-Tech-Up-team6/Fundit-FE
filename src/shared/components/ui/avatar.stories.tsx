import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Avatar } from "./avatar";

const meta = {
  title: "Shared/UI/Avatar",
  component: Avatar,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: { size: 40 },
  argTypes: {
    size: { control: "radio", options: [20, 24, 28, 32, 36, 40, 46] },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Gallery: Story = {
  render: (args) => (
    <div className="flex items-end gap-3">
      {([20, 24, 28, 32, 36, 40, 46] as const).map((size) => (
        <Avatar {...args} key={size} size={size} />
      ))}
    </div>
  ),
};
