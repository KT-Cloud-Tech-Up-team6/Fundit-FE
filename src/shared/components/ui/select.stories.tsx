import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Select } from "./select";

const domains = ["직접 입력", "@gmail.com", "@naver.com", "@daum.com"];

const meta = {
  title: "Shared/UI/Select",
  component: Select,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: {
    children: (
      <>
        <option value="">@ 선택</option>
        {domains.map((domain) => (
          <option key={domain} value={domain}>
            {domain}
          </option>
        ))}
      </>
    ),
    disabled: false,
    error: false,
  },
  decorators: [
    (Story) => (
      <div className="w-[170px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Selected: Story = {
  args: { defaultValue: "@gmail.com" },
};

export const Error: Story = {
  args: { defaultValue: "@gmail.com", error: true },
};

export const Disabled: Story = {
  args: { defaultValue: "@gmail.com", disabled: true },
};

export const Gallery: Story = {
  render: (args) => (
    <div className="flex w-[350px] flex-col gap-3">
      <Select {...args} />
      <Select {...args} defaultValue="@gmail.com" />
      <Select {...args} defaultValue="@gmail.com" error />
      <Select {...args} defaultValue="@gmail.com" disabled />
    </div>
  ),
};
