import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, expect, userEvent, within } from "storybook/test";
import { InputButton } from "./input-button";
import { Button } from "./button";
const onLookup = fn();
const meta = {
  title: "Shared/UI/InputButton",
  component: InputButton,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-[350px] max-w-full">
        <Story />
      </div>
    ),
  ],
  args: {
    inputProps: { "aria-label": "주소", placeholder: "주소를 검색해 주세요.", readOnly: true },
    button: (
      <Button appearance="cta" onClick={onLookup}>
        검색
      </Button>
    ),
  },
} satisfies Meta<typeof InputButton>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  play: async ({ canvasElement }) => {
    onLookup.mockClear();
    await userEvent.click(within(canvasElement).getByRole("button", { name: "검색" }));
    await expect(onLookup).toHaveBeenCalledTimes(1);
  },
};
export const FigmaDisabledInput: Story = {
  args: {
    inputProps: { "aria-label": "주소", placeholder: "주소를 검색해 주세요.", disabled: true },
  },
};
export const WithValue: Story = {
  args: { inputProps: { "aria-label": "주소", defaultValue: "서울특별시 종로구", readOnly: true } },
};
export const Disabled: Story = {
  args: {
    inputProps: { "aria-label": "주소", disabled: true },
    button: (
      <Button appearance="cta" disabled>
        검색
      </Button>
    ),
  },
};
