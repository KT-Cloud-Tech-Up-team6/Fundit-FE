import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, fireEvent, userEvent, within } from "storybook/test";

import { SearchField } from "./search-field";

const meta = {
  title: "Shared/UI/SearchField",
  component: SearchField,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-[min(350px,calc(100vw-32px))]">
        <Story />
      </div>
    ),
  ],
  args: {
    "aria-label": "검색어",
    placeholder: "검색어를 입력해 주세요",
  },
  argTypes: {
    size: { control: "radio", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof SearchField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Large: Story = { args: { size: "lg" } };

export const Controlled: Story = {
  render: function Render(args) {
    const [value, setValue] = useState("");
    return (
      <SearchField
        {...args}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onClear={() => setValue("")}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "검색어" });
    await fireEvent.change(input, { target: { value: "프로젝트" } });
    await userEvent.click(canvas.getByRole("button", { name: "검색어 지우기" }));
    await expect(input).toHaveValue("");
    await expect(canvas.queryByRole("button")).not.toBeInTheDocument();
  },
};

export const Uncontrolled: Story = {
  args: { defaultValue: "검색어" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "검색어 지우기" }));
    await expect(canvas.getByRole("textbox")).toHaveValue("");
  },
};

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
