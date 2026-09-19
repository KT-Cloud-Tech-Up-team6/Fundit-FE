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
    variant: { control: "radio", options: ["default", "inverse"] },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Horizontal: Story = {
  args: { direction: "horizontal" },
};

/** inverse는 꼬리가 11×9로 더 크다(Figma) — 기본 8×4와 나란히 비교한다. */
export const Inverse: Story = {
  args: { variant: "inverse", children: "예상 시작일 2026.09.20" },
};

export const Gallery: Story = {
  render: (args) => (
    <div className="flex items-center gap-8">
      <Tooltip {...args} direction="vertical" />
      <Tooltip {...args} direction="horizontal" />
      <Tooltip {...args} direction="vertical" variant="inverse" />
      <Tooltip {...args} direction="horizontal" variant="inverse" />
    </div>
  ),
};
