import type { Meta, StoryObj } from "@storybook/nextjs-vite";

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
};
