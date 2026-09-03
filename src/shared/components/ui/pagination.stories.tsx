import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Pagination } from "./pagination";

const meta = {
  title: "Shared/UI/Pagination",
  component: Pagination,
  tags: ["autodocs"],
  parameters: { layout: "centered", nextjs: { appDirectory: true } },
  args: {
    currentPage: 1,
    totalPages: 3,
    buildHref: (page: number) => `?page=${page}`,
  },
  argTypes: {
    currentPage: { control: { min: 1, step: 1, type: "number" } },
    totalPages: { control: { min: 1, step: 1, type: "number" } },
    buildHref: { control: false },
  },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Figma 는 1페이지일 때도 페이지네이션을 노출한다. 이전·다음이 모두 비활성이다. */
export const SinglePage: Story = {
  args: { currentPage: 1, totalPages: 1 },
};

export const FirstPage: Story = {
  args: { currentPage: 1, totalPages: 3 },
};

export const MiddlePage: Story = {
  args: { currentPage: 2, totalPages: 3 },
};

export const LastPage: Story = {
  args: { currentPage: 3, totalPages: 3 },
};

export const Gallery: Story = {
  render: (args) => (
    <div className="flex flex-col gap-6">
      {(
        [
          [1, 1, "1페이지"],
          [1, 3, "첫 페이지"],
          [2, 3, "중간 페이지"],
          [3, 3, "마지막 페이지"],
        ] as const
      ).map(([currentPage, totalPages, label]) => (
        <div key={label} className="flex flex-col items-center gap-1">
          <Pagination {...args} currentPage={currentPage} totalPages={totalPages} />
          <span className="text-caption-s text-text-secondary">{label}</span>
        </div>
      ))}
    </div>
  ),
};
