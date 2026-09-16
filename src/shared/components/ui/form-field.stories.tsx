import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { FormField } from "./form-field";
import { Input } from "./input";
import { Checkbox } from "./checkbox";
const meta = {
  title: "Shared/UI/FormField",
  component: FormField,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-[350px] max-w-full">
        <Story />
      </div>
    ),
  ],
  args: {
    htmlFor: "quantity",
    label: "리워드 수량",
    description: "제공할 수량을 입력해 주세요.",
    children: (
      <Input
        id="quantity"
        aria-describedby="quantity-description"
        inputMode="numeric"
        placeholder="수량 입력"
      />
    ),
  },
} satisfies Meta<typeof FormField>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText("리워드 수량"));
    await expect(canvas.getByRole("textbox")).toHaveFocus();
    await expect(canvas.getByRole("textbox")).toHaveAccessibleDescription(
      "제공할 수량을 입력해 주세요.",
    );
  },
};
export const WithAction: Story = {
  args: {
    action: (
      <label className="text-body-s flex items-center gap-2 leading-[1.42] font-medium">
        <span>수량 제한</span>
        <input type="checkbox" className="size-4 accent-current" />
      </label>
    ),
  },
};
export const ExistingCheckbox: Story = {
  args: { action: <Checkbox shape="square" aria-label="수량 제한" /> },
};
export const Error: Story = {
  args: {
    errorMessage: "1개 이상 입력해 주세요.",
    children: (
      <Input
        id="quantity"
        defaultValue="0"
        error
        aria-describedby="quantity-description quantity-error"
      />
    ),
  },
};
export const Disabled: Story = {
  args: { children: <Input id="quantity" disabled aria-describedby="quantity-description" /> },
};
