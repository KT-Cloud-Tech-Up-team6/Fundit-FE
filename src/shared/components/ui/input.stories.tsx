import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Image from "next/image";
import { useRef, useState } from "react";
import { expect, fireEvent, userEvent, within } from "storybook/test";

import { Input } from "./input";

const meta = {
  title: "Shared/UI/Input",
  component: Input,
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
    "aria-label": "입력 내용",
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

export const Clearable: Story = {
  render: function Render(args) {
    const [value, setValue] = useState("입력한 내용");
    const input = useRef<HTMLInputElement>(null);
    return (
      <Input
        {...args}
        ref={input}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        endAdornment={
          value && (
            <button
              type="button"
              aria-label="내용 지우기"
              onClick={() => {
                setValue("");
                input.current?.focus();
              }}
              className="focus-visible:outline-border-primary flex size-7 items-center justify-center rounded-full focus-visible:outline-2"
            >
              <Image alt="" src="/icons/input-clear.svg" width={12} height={12} />
            </button>
          )
        }
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");
    await userEvent.click(canvas.getByRole("button", { name: "내용 지우기" }));
    await expect(input).toHaveValue("");
    await expect(input).toHaveFocus();
    await fireEvent.change(input, { target: { value: "다시 입력" } });
    await expect(canvas.getByRole("button", { name: "내용 지우기" })).toBeInTheDocument();
  },
};

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
    <div className="flex w-full flex-col gap-3">
      <Input {...args} size="sm" />
      <Input {...args} size="md" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const inputs = within(canvasElement).getAllByRole("textbox");
    expect(getComputedStyle(inputs[0].parentElement as HTMLElement).height).toBe("36px");
    expect(getComputedStyle(inputs[1].parentElement as HTMLElement).height).toBe("52px");
    expect(getComputedStyle(inputs[1].parentElement as HTMLElement).borderRadius).toBe("8px");
  },
};

export const Compact: Story = {
  args: { shape: "compact" },
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole("textbox");
    expect(getComputedStyle(input.parentElement as HTMLElement).borderRadius).toBe("4px");
  },
};

export const WithEndAdornment: Story = {
  args: {
    endAdornment: <span className="text-label-m text-text-secondary">원</span>,
    inputMode: "numeric",
    placeholder: "금액을 입력해 주세요",
  },
};

export const WithStartAdornment: Story = {
  args: {
    placeholder: "도로명, 지번, 건물명 검색",
    startAdornment: <Image alt="" height={20} src="/icons/search.svg" width={20} />,
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
