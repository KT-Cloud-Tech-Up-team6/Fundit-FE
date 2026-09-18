import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { DateField } from "./date-field";

const meta = {
  title: "Shared/UI/DateField",
  component: DateField,
  tags: ["autodocs"],
  args: { placeholder: "날짜를 선택하세요", value: "", "aria-label": "날짜", onChange: () => {} },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <DateField {...args} onChange={setValue} value={value} />;
  },
} satisfies Meta<typeof DateField>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const WithValue: Story = { args: { value: "2026-09-28" } };

export const PickAndClose: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "날짜" });
    await expect(trigger).toHaveTextContent("날짜를 선택하세요");

    await userEvent.click(trigger);
    const grid = canvas.getByRole("grid");
    await expect(grid).toBeVisible();

    await userEvent.click(within(grid).getAllByRole("button")[10]);
    await expect(canvas.queryByRole("grid")).not.toBeInTheDocument();
    await expect(trigger).not.toHaveTextContent("날짜를 선택하세요");
  },
};

/** 트리거가 화면 아래쪽(모달 하단 등)에 있으면 패널이 잘리지 않게 위로 열린다. */
export const OpensUpwardNearBottom: Story = {
  decorators: [
    (Story) => (
      <div style={{ paddingTop: "85vh" }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "날짜" });

    await userEvent.click(trigger);
    const dialog = canvas.getByRole("dialog");
    await expect(dialog).toHaveClass("bottom-full");
  },
};
