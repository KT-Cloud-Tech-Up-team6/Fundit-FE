import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Chip } from "./chip";

const meta = {
  title: "Shared/UI/Chip",
  component: Chip,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: {
    appearance: "fill",
    children: "칩",
    size: "sm",
    variant: "primary",
  },
  argTypes: {
    appearance: { control: "radio", options: ["fill", "outline", "selected"] },
    size: { control: "radio", options: ["sm", "md"] },
    variant: { control: "radio", options: ["primary", "primaryLive"] },
  },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const PrimaryLive: Story = {
  args: { variant: "primaryLive" },
};

export const Selected: Story = {
  args: { appearance: "selected" },
};

export const Gallery: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      {(["primary", "primaryLive"] as const).map((variant) => (
        <div className="flex flex-col gap-2" key={variant}>
          {(["fill", "outline", "selected"] as const).map((appearance) => (
            <div className="flex items-center gap-3" key={appearance}>
              {(["sm", "md"] as const).map((size) => (
                <Chip {...args} appearance={appearance} key={size} size={size} variant={variant}>
                  {variant} {appearance} {size}
                </Chip>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
};
