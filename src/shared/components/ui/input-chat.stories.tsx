import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, fireEvent, fn, userEvent, within } from "storybook/test";
import { InputChat } from "./input-chat";
const meta = {
  title: "Shared/UI/InputChat",
  component: InputChat,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-[350px] max-w-full">
        <Story />
      </div>
    ),
  ],
  args: {
    value: "",
    "aria-label": "메시지",
    placeholder: "메시지를 입력해 주세요.",
    onSend: fn(),
    onAttach: fn(),
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <InputChat
        {...args}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onSend={(text) => {
          args.onSend(text);
          setValue("");
        }}
      />
    );
  },
} satisfies Meta<typeof InputChat>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Active: Story = { args: { value: "입력한 메시지입니다." } };
export const Disabled: Story = { args: { disabled: true } };
export const WithoutAttachment: Story = { args: { onAttach: undefined } };
export const StoryInput: Story = {
  args: { appearance: "story", attachDisabled: true, onAttach: undefined },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByRole("button", { name: "파일 첨부" })).toBeDisabled();
    await userEvent.type(canvas.getByRole("textbox", { name: "메시지" }), "작성한 답변");
    expect(canvas.getByRole("button", { name: "메시지 보내기" })).toBeEnabled();
  },
};
export const Multiline: Story = {
  args: { rows: 3, value: "여러 줄 메시지입니다.\n줄바꿈을 유지합니다." },
};
export const Interaction: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "메시지" });
    const send = canvas.getByRole("button", { name: "메시지 보내기" });
    await expect(send).toBeDisabled();
    await fireEvent.change(input, { target: { value: "   " } });
    await expect(send).toBeDisabled();
    await fireEvent.change(input, { target: { value: "안녕하세요" } });
    await fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    await expect(args.onSend).not.toHaveBeenCalled();
    await fireEvent.keyDown(input, { key: "Enter", shiftKey: true });
    await expect(args.onSend).not.toHaveBeenCalled();
    await fireEvent.keyDown(input, { key: "Enter" });
    await expect(args.onSend).toHaveBeenCalledTimes(1);
    await expect(args.onSend).toHaveBeenCalledWith("안녕하세요");
    await expect(input).toHaveValue("");
    await fireEvent.change(input, { target: { value: "두 번째 메시지" } });
    await userEvent.click(send);
    await expect(args.onSend).toHaveBeenLastCalledWith("두 번째 메시지");
    await userEvent.click(canvas.getByRole("button", { name: "파일 첨부" }));
    await expect(args.onAttach).toHaveBeenCalledTimes(1);
  },
};
