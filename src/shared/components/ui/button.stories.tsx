import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { Button } from "./button";

const meta = {
  title: "Shared/UI/Button",
  component: Button,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: {
    children: "버튼",
    size: "lg",
    variant: "primary",
  },
  argTypes: {
    size: { control: "radio", options: ["sm", "md", "lg"] },
    variant: { control: "radio", options: ["primary", "primaryLive"] },
    appearance: { control: "radio", options: ["default", "cta"] },
    shape: { control: "radio", options: ["default", "pill"] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const PrimaryLive: Story = {
  args: { variant: "primaryLive" },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Cta: Story = {
  args: { appearance: "cta", onClick: fn() },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole("button");
    const style = getComputedStyle(button);
    expect(style.fontSize).toBe("16px");
    expect(style.fontWeight).toBe("600");
    expect(style.lineHeight).toBe("24px");
    expect(style.height).toBe("46px");
    button.focus();
    expect(button).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const CtaPill: Story = {
  args: { appearance: "cta", size: "sm", shape: "pill" },
  play: async ({ canvasElement }) => {
    const style = getComputedStyle(within(canvasElement).getByRole("button"));
    expect(style.height).toBe("36px");
    expect(parseFloat(style.borderRadius)).toBeGreaterThanOrEqual(18);
    expect(style.paddingLeft).toBe("16px");
    expect(style.paddingRight).toBe("16px");
  },
};

export const CtaDisabled: Story = {
  args: { appearance: "cta", size: "md", disabled: true, onClick: fn() },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole("button");
    expect(getComputedStyle(button).height).toBe("40px");
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const Gallery: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      {(["primary", "primaryLive"] as const).map((variant) => (
        <div className="flex flex-col gap-2" key={variant}>
          {[false, true].map((disabled) => (
            <div className="flex items-center gap-3" key={String(disabled)}>
              {(["sm", "md", "lg"] as const).map((size) => (
                <Button {...args} disabled={disabled} key={size} size={size} variant={variant}>
                  {disabled ? "disabled" : variant} {size}
                </Button>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const variant of ["primary", "primaryLive"]) {
      for (const [size, height, fontSize, fontWeight] of [
        ["sm", "28px", "16px", "400"],
        ["md", "36px", "18px", "500"],
        ["lg", "46px", "18px", "500"],
      ]) {
        const style = getComputedStyle(canvas.getByRole("button", { name: `${variant} ${size}` }));
        expect(style.height).toBe(height);
        expect(style.fontSize).toBe(fontSize);
        expect(style.fontWeight).toBe(fontWeight);
        expect(style.borderRadius).toBe("4px");
      }
    }
  },
};
