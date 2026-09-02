import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Icon } from "./icon";

const names = [
  "archive",
  "bell",
  "live",
  "people",
  "profile",
  "settings",
  "swap",
] as const satisfies readonly Parameters<typeof Icon>[0]["name"][];

const meta = {
  title: "Shared/UI/Icon",
  component: Icon,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: { name: "archive", className: "size-5" },
  argTypes: {
    name: { control: "select", options: names },
    className: { control: "text" },
  },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 전체 아이콘. public/icons 의 SVG 를 mask 로 깔고 색은 bg-current 로 상속받는다. */
export const Gallery: Story = {
  render: (args) => (
    <ul className="grid grid-cols-4 gap-6">
      {names.map((name) => (
        <li key={name} className="flex w-20 flex-col items-center gap-2">
          <Icon {...args} name={name} />
          <span className="text-caption-s text-text-secondary">{name}</span>
        </li>
      ))}
    </ul>
  ),
};

/** 파일에 박힌 stroke 색과 무관하게 부모의 text 색을 따른다. */
export const ColorInheritance: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      {(
        [
          ["text-text-default", "활성"],
          ["text-text-secondary", "비활성"],
          ["text-text-primary-live", "LIVE"],
        ] as const
      ).map(([className, label]) => (
        <div key={className} className={`flex items-center gap-3 ${className}`}>
          {names.map((name) => (
            <Icon {...args} key={name} name={name} />
          ))}
          <span className="text-caption-s">{label}</span>
        </div>
      ))}
    </div>
  ),
};

/** Figma 사용 치수. GNB 16, 헤더 액션 20, 모드 전환·참여자수 14. */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-end gap-6">
      {(
        [
          ["size-3.5", "14"],
          ["size-4", "16"],
          ["size-5", "20"],
        ] as const
      ).map(([className, label]) => (
        <div key={className} className="flex flex-col items-center gap-2">
          <Icon {...args} className={className} />
          <span className="text-caption-s text-text-secondary">{label}</span>
        </div>
      ))}
    </div>
  ),
};
