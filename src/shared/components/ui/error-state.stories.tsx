import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { ErrorState, type ErrorStateProps } from "./error-state";

const meta = {
  title: "Shared/UI/ErrorState",
  component: ErrorState,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="flex min-h-dvh w-full flex-col">
        <Story />
      </div>
    ),
  ],
  args: {
    variant: "page",
    status: "notFound",
    action: { onClick: fn() },
  },
  argTypes: {
    variant: { control: "radio", options: ["page", "section", "text"] },
    status: {
      control: "radio",
      options: ["notFound", "server", "forbidden", "unauthorized", "network"],
    },
  },
} satisfies Meta<ErrorStateProps>;
export default meta;
type Story = StoryObj<ErrorStateProps>;

export const NotFound: Story = {};
export const Server: Story = { args: { status: "server" } };
export const Forbidden: Story = { args: { status: "forbidden" } };
export const Unauthorized: Story = { args: { status: "unauthorized" } };
export const Network: Story = { args: { status: "network" } };

export const Section: Story = {
  args: {
    variant: "section",
    description: "배송지 조회를 실패하였습니다",
    action: { onClick: fn(), label: "다시 시도" },
  },
};

export const Text: Story = {
  args: {
    variant: "text",
    description: "배송지 조회를 실패하였습니다",
    action: undefined,
  },
};

export const LongContent: Story = {
  args: {
    status: undefined,
    title: "예상보다 긴 제목이 들어오는 경우",
    description: "설명도 예상보다 길어질 수 있어 두 줄 이상으로 감싸지는지 확인합니다",
    caption: "캡션도 마찬가지로 길어질 수 있는 문구를 넣어 줄바꿈을 확인합니다",
    action: { onClick: fn(), label: "다시 시도" },
  },
};

export const Gallery: Story = {
  render: (args: ErrorStateProps) => (
    <div className="flex flex-col gap-10">
      {(["notFound", "server", "forbidden", "unauthorized", "network"] as const).map((status) => (
        <ErrorState key={status} {...args} status={status} />
      ))}
    </div>
  ),
};
