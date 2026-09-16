import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { expect, userEvent, within } from "storybook/test";

import { Calendar } from "./calendar";

const meta = {
  title: "Shared/UI/Calendar",
  component: Calendar,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const grid = canvas.getByRole("grid");
    const next = canvas.getByRole("button", { name: "다음 달로 이동" });
    const previous = canvas.getByRole("button", { name: "이전 달로 이동" });
    await expect(previous.getBoundingClientRect().left).toBeGreaterThanOrEqual(
      grid.getBoundingClientRect().left,
    );
    await expect(next.getBoundingClientRect().right).toBeLessThanOrEqual(
      grid.getBoundingClientRect().right + 1,
    );
    const month = grid.getAttribute("aria-label");
    await userEvent.click(next);
    await expect(canvas.getByRole("grid")).not.toHaveAttribute("aria-label", month);
    await userEvent.click(previous);
    await expect(canvas.getByRole("grid")).toHaveAttribute("aria-label", month);
  },
  render: function SingleStory() {
    const [selected, setSelected] = useState<Date>();
    return <Calendar mode="single" onSelect={setSelected} selected={selected} />;
  },
};

/** 펀딩 기간처럼 시작일·종료일을 함께 고르는 화면에서 쓴다. */
export const Range: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const days = within(canvas.getByRole("grid")).getAllByRole("button");
    await userEvent.click(days[10]);
    await userEvent.click(days[14]);
    await userEvent.unhover(days[14]);
    await expect(getComputedStyle(days[10]).backgroundColor).not.toBe(
      getComputedStyle(days[12]).backgroundColor,
    );
    await expect(getComputedStyle(days[10]).backgroundColor).toBe(
      getComputedStyle(days[14]).backgroundColor,
    );
    await userEvent.hover(days[14]);
    await expect(getComputedStyle(days[14]).backgroundColor).not.toBe(
      getComputedStyle(days[12]).backgroundColor,
    );
  },
  render: function RangeStory() {
    const [selected, setSelected] = useState<DateRange>();
    return <Calendar mode="range" onSelect={setSelected} selected={selected} />;
  },
};

export const WithDisabledPast: Story = {
  render: function DisabledPastStory() {
    const [selected, setSelected] = useState<Date>();
    return (
      <Calendar
        disabled={{ before: new Date() }}
        mode="single"
        onSelect={setSelected}
        selected={selected}
      />
    );
  },
};
