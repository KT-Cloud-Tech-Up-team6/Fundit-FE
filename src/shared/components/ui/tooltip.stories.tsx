import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Tooltip } from "./tooltip";

const meta = {
  title: "Shared/UI/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: {
    children: "text",
    direction: "vertical",
  },
  argTypes: {
    direction: { control: "radio", options: ["vertical", "horizontal"] },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Horizontal: Story = {
  args: { direction: "horizontal" },
};

export const Gallery: Story = {
  render: (args) => (
    <div className="flex items-center gap-8">
      <Tooltip {...args} direction="vertical" />
      <Tooltip {...args} direction="horizontal" />
    </div>
  ),
};
