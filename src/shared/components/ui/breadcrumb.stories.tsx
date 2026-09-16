import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Breadcrumb } from "./breadcrumb";

const meta = {
  title: "Shared/UI/Breadcrumb",
  component: Breadcrumb,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { items: ["내 프로젝트", "제작 · 배송"] },
};

export const LongPath: Story = {
  args: { items: ["내 프로젝트", "신규 생성하기", "기본 정보 등록", "스토리 작성"] },
};
