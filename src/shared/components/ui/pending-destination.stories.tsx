import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Icon } from "./icon";
import { PendingDestination } from "./pending-destination";

const meta = {
  title: "Shared/UI/PendingDestination",
  component: PendingDestination,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: { label: "알림함" },
} satisfies Meta<typeof PendingDestination>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 메뉴 행. label이 그대로 본문이 된다. */
export const MenuRow: Story = {
  args: { label: "회원 정보 관리", className: "text-body-m flex min-h-10 items-center" },
};

/** 아이콘 자리. children으로 아이콘을 넘기고 label은 보조 기술용으로만 쓴다. */
export const IconSlot: Story = {
  args: {
    label: "알림함",
    className: "flex size-10 items-center justify-center",
    children: <Icon name="bell" className="size-6" />,
  },
};
