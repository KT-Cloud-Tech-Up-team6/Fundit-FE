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
  argTypes: {
    size: { control: "radio", options: ["sm", "md"] },
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

/** 판매자 프로젝트 목록의 검색 필드. Figma 36px 높이다. */
export const Small: Story = {
  args: { placeholder: "검색하기", size: "sm" },
};

export const Gallery: Story = {
  render: (args) => (
    <div className="flex flex-col gap-9">
      <SearchField {...args} />
      <SearchField {...args} autoFocus defaultValue="검색어" />
      <SearchField {...args} disabled />
      <SearchField {...args} placeholder="검색하기" size="sm" />
    </div>
  ),
};
