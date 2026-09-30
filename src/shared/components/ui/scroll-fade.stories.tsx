import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ScrollFade } from "./scroll-fade";

const meta = {
  title: "Shared/UI/ScrollFade",
  component: ScrollFade,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof ScrollFade>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ScrollFade className="bg-layer-surface-default w-80">
      <ul className="flex gap-3 overflow-x-auto">
        {Array.from({ length: 6 }, (_, i) => (
          <li
            key={i}
            className="bg-layer-bg text-body-s flex size-36 shrink-0 items-center justify-center rounded-xs"
          >
            카드 {i + 1}
          </li>
        ))}
      </ul>
    </ScrollFade>
  ),
};

/** 넘길 것이 없으면 그라데이션이 나타나지 않는다. */
export const NoOverflow: Story = {
  render: () => (
    <ScrollFade className="bg-layer-surface-default w-80">
      <ul className="flex gap-3 overflow-x-auto">
        {Array.from({ length: 2 }, (_, i) => (
          <li
            key={i}
            className="bg-layer-bg text-body-s flex size-36 shrink-0 items-center justify-center rounded-xs"
          >
            카드 {i + 1}
          </li>
        ))}
      </ul>
    </ScrollFade>
  ),
};
