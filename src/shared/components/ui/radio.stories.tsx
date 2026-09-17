import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Radio } from "./radio";

const meta = {
  title: "Shared/UI/Radio",
  component: Radio,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: {
    children: "라디오",
    name: "radio-story",
  },
} satisfies Meta<typeof Radio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Selected: Story = {
  args: { defaultChecked: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Gallery: Story = {
  render: (args) => (
    <div className="flex items-center gap-6">
      <Radio {...args} name="radio-unchecked" defaultChecked={false} />
      <Radio {...args} name="radio-checked" defaultChecked />
      <Radio {...args} name="radio-disabled" disabled />
      <Radio {...args} name="radio-checked-disabled" defaultChecked disabled />
    </div>
  ),
};
