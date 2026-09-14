import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import { Dropdown } from "./dropdown";

const options = [
  { value: "recent", label: "최신순" },
  { value: "popular", label: "인기순", disabled: true },
  { value: "closing", label: "마감 임박순" },
];
const meta = {
  title: "Shared/UI/Dropdown",
  component: Dropdown,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="min-h-72 w-[350px] max-w-full">
        <Story />
      </div>
    ),
  ],
  args: { options, value: "", onValueChange: fn(), "aria-label": "정렬 기준" },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <Dropdown
        {...args}
        value={value}
        onValueChange={(next) => {
          setValue(next);
          args.onValueChange(next);
        }}
      />
    );
  },
} satisfies Meta<typeof Dropdown>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Small: Story = {
  args: { size: "sm" },
  decorators: [
    (Story) => (
      <div className="w-[184px]">
        <Story />
      </div>
    ),
  ],
};
export const ExtraSmall: Story = {
  args: { size: "xs" },
  decorators: [
    (Story) => (
      <div className="w-[98px]">
        <Story />
      </div>
    ),
  ],
};
export const Selected: Story = { args: { value: "recent" } };
export const Disabled: Story = { args: { disabled: true } };
export const LongContent: Story = {
  args: {
    options: [{ value: "long", label: "여러 줄로 표시되는 매우 긴 선택 항목의 이름입니다." }],
    value: "long",
  },
};
export const Keyboard: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "정렬 기준" });
    await userEvent.click(button);
    await expect(canvas.getByRole("option", { name: "최신순" })).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    await expect(canvas.getByRole("option", { name: "마감 임박순" })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(args.onValueChange).toHaveBeenLastCalledWith("closing");
    await expect(button).toHaveFocus();
    await expect(button).toHaveTextContent("마감 임박순");
    await expect(canvas.queryByRole("listbox")).not.toBeInTheDocument();
    await userEvent.keyboard("{ArrowDown}{Home}");
    await expect(canvas.getByRole("option", { name: "최신순" })).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await expect(button).toHaveTextContent("마감 임박순");
    await expect(button).toHaveFocus();
  },
};
export const PointerAndBlur: Story = {
  render: function Render(args) {
    const [value, setValue] = useState("");
    return (
      <>
        <Dropdown {...args} value={value} onValueChange={setValue} />
        <button type="button">바깥 버튼</button>
      </>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "정렬 기준" });
    await userEvent.click(button);
    await userEvent.click(canvas.getByRole("option", { name: "인기순" }));
    await expect(button).toHaveTextContent("선택해 주세요");
    await userEvent.click(canvas.getByRole("option", { name: "마감 임박순" }));
    await expect(button).toHaveTextContent("마감 임박순");
    await userEvent.click(button);
    await userEvent.click(canvas.getByRole("button", { name: "바깥 버튼" }));
    await expect(canvas.queryByRole("listbox")).not.toBeInTheDocument();
    await userEvent.click(button);
    await userEvent.tab();
    await expect(canvas.queryByRole("listbox")).not.toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "바깥 버튼" })).toHaveFocus();
  },
};
