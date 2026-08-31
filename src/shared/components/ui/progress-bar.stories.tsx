import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ProgressBar } from "./progress-bar";

const meta = {
  title: "Shared/UI/ProgressBar",
  component: ProgressBar,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-[390px]">
        <Story />
      </div>
    ),
  ],
  args: {
    "aria-label": "진행률",
    value: 33.333,
    variant: "primary",
  },
  argTypes: {
    value: { control: { min: 0, max: 100, step: 1, type: "range" } },
    variant: { control: "radio", options: ["primary", "primaryLive"] },
  },
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const PrimaryLive: Story = {
  args: { variant: "primaryLive" },
};

export const Gallery: Story = {
  render: (args) => (
    <div className="flex flex-col gap-9">
      <ProgressBar {...args} variant="primary" />
      <ProgressBar {...args} variant="primaryLive" />
    </div>
  ),
};
