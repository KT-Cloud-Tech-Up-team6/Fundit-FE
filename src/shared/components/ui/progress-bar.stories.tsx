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
    knob: { control: "boolean" },
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

/** 판매자 프로젝트 목록 카드의 rating_bar 는 끝점 손잡이가 없다. */
export const NoKnob: Story = {
  args: { knob: false },
};

export const Gallery: Story = {
  render: (args) => (
    <div className="flex flex-col gap-9">
      <ProgressBar {...args} variant="primary" />
      <ProgressBar {...args} variant="primaryLive" />
      <ProgressBar {...args} knob={false} variant="primary" />
      <ProgressBar {...args} knob={false} variant="primaryLive" />
    </div>
  ),
};
