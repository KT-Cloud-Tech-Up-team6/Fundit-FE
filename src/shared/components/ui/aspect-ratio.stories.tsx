import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AspectRatio } from "./aspect-ratio";

const meta = {
  title: "Shared/UI/AspectRatio",
  component: AspectRatio,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: { ratio: "1:1" },
  argTypes: {
    ratio: { control: "radio", options: ["1:1", "3:4", "4:3", "9:16", "16:9"] },
  },
} satisfies Meta<typeof AspectRatio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-50">
      <AspectRatio {...args} />
    </div>
  ),
};

export const Gallery: Story = {
  render: () => (
    <div className="flex items-end gap-3">
      {(["1:1", "3:4", "4:3", "9:16", "16:9"] as const).map((ratio) => (
        <div className="w-30" key={ratio}>
          <AspectRatio ratio={ratio} />
        </div>
      ))}
    </div>
  ),
};
