import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Image from "next/image";

import { Input } from "./input";

const meta = {
  title: "Shared/UI/Input",
  component: Input,
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
    placeholder: "내용을 입력해 주세요",
  },
  argTypes: {
    endAdornment: { control: false },
    error: { control: "boolean" },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValue: Story = {
  args: { defaultValue: "입력된 값" },
};

export const Active: Story = {
  args: {
    autoFocus: true,
    defaultValue: "입력된 값",
    endAdornment: <Image alt="" height={10} src="/icons/input-clear.svg" width={10} />,
  },
};

export const Error: Story = {
  args: {
    endAdornment: <Image alt="" height={10} src="/icons/input-clear-error.svg" width={10} />,
    error: true,
  },
};

export const Disabled: Story = {
  args: { disabled: true },
};

/** sm은 36px 컨트롤 줄(발송정보 표의 운송장 입력)에 서는 크기다. */
export const Small: Story = {
  args: { size: "sm" },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex w-[350px] flex-col gap-3">
      <Input {...args} size="sm" />
      <Input {...args} size="md" />
    </div>
  ),
};

export const WithEndAdornment: Story = {
  args: {
    endAdornment: <span className="text-label-m text-text-secondary">원</span>,
    inputMode: "numeric",
    placeholder: "금액을 입력해 주세요",
  },
};

export const Gallery: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Input {...args} />
      <Input
        {...args}
        autoFocus
        defaultValue="입력된 값"
        endAdornment={<Image alt="" height={10} src="/icons/input-clear.svg" width={10} />}
      />
      <Input
        {...args}
        endAdornment={<Image alt="" height={10} src="/icons/input-clear-error.svg" width={10} />}
        error
      />
      <Input {...args} disabled />
      <Input
        {...args}
        endAdornment={<span className="text-label-m text-text-secondary">원</span>}
        inputMode="numeric"
        placeholder="금액을 입력해 주세요"
      />
    </div>
  ),
};
