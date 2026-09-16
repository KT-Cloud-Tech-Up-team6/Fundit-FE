import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { Button, secondaryButtonClasses } from "./button";
import { ChatDialogue } from "./chat-dialogue";
const meta = {
  title: "Shared/UI/ChatDialogue",
  component: ChatDialogue,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-[549px] max-w-full">
        <Story />
      </div>
    ),
  ],
  args: { sender: "ai", children: "어떤 프로젝트를 소개하고 싶으신가요?", progress: "1/5" },
} satisfies Meta<typeof ChatDialogue>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("AI 메시지")).toBeInTheDocument();
  },
};
export const User: Story = {
  args: { sender: "user", children: "일상에서 사용할 수 있는 제품입니다." },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("사용자 메시지")).toBeInTheDocument();
  },
};
export const CustomAvatar: Story = {
  args: { avatar: <span aria-hidden>●</span> },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("AI 메시지")).toBeInTheDocument();
  },
};
export const Medium: Story = { args: { size: "md" } };
export const WithActions: Story = {
  args: {
    status: "요약 중…",
    actions: (
      <>
        <button
          type="button"
          className={`${secondaryButtonClasses} h-9 rounded-full border border-[#d9d9d9] bg-[#ffffff]! px-3 text-[#000000]!`}
        >
          해당 사항 없음
        </button>
        <Button size="md" appearance="cta" shape="pill" className="bg-[#000000]! text-[#ffffff]!">
          그대로 생성하기
        </Button>
      </>
    ),
  },
};
export const LongContent: Story = {
  args: {
    children:
      "프로젝트의 특징과 제작 과정을 자세히 소개해 주세요. 제품을 처음 접하는 사람도 이해할 수 있도록 핵심 내용을 함께 정리해 드릴게요.\n여러 줄의 메시지도 그대로 표시합니다.",
  },
};
