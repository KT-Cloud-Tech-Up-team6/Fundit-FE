import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Link from "next/link";
import { Checkbox } from "./checkbox";
import { ListItem } from "./list-item";
const arrow = (
  <span
    aria-hidden
    className="size-4 bg-current [mask-image:url('/icons/molecules/list-arrow.svg')] [mask-size:contain] [mask-position:center] [mask-repeat:no-repeat]"
  />
);
const meta = {
  title: "Shared/UI/ListItem",
  component: ListItem,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-[350px] max-w-full">
        <Story />
      </div>
    ),
  ],
  args: { children: "목록 항목" },
} satisfies Meta<typeof ListItem>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Navigation: Story = {
  render: (args) => (
    <Link href="/my" className="focus-visible:outline-border-primary block focus-visible:outline-2">
      <ListItem {...args} trailing={arrow}>
        마이페이지
      </ListItem>
    </Link>
  ),
};
export const WithCheckbox: Story = {
  args: { leading: <Checkbox shape="square" aria-label="목록 항목 선택" /> },
};
export const WithRadio: Story = {
  render: (args) => (
    <div role="radiogroup" aria-label="선택 항목">
      {["첫 번째 항목", "두 번째 항목"].map((label) => (
        <ListItem
          {...args}
          key={label}
          leading={
            <span>
              <input
                type="radio"
                name="list-choice"
                aria-label={label}
                className="size-5 accent-current"
              />
            </span>
          }
        >
          {label}
        </ListItem>
      ))}
    </div>
  ),
};
export const LongContent: Story = {
  args: {
    children: "여러 줄로 표시되는 긴 목록 항목도 옆의 선택 영역과 겹치지 않고 줄바꿈됩니다.",
    trailing: arrow,
  },
};
