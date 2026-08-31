import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SearchField } from "./search-field";

const meta = {
  title: "Shared/UI/SearchField",
  component: SearchField,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-[350px]">
        <Story />
      </div>
    ),
  ],
  args: {
    placeholder: "검색어를 입력해 주세요",
  },
} satisfies Meta<typeof SearchField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Active: Story = {
  args: { autoFocus: true, defaultValue: "검색어" },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Gallery: Story = {
  render: (args) => (
    <div className="flex flex-col gap-9">
      <SearchField {...args} />
      <SearchField {...args} autoFocus defaultValue="검색어" />
      <SearchField {...args} disabled />
    </div>
  ),
};
