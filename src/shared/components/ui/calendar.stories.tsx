import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import type { DateRange } from "react-day-picker";

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
  render: function SingleStory() {
    const [selected, setSelected] = useState<Date>();
    return <Calendar mode="single" onSelect={setSelected} selected={selected} />;
  },
};

/** 펀딩 기간처럼 시작일·종료일을 함께 고르는 화면에서 쓴다. */
export const Range: Story = {
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
