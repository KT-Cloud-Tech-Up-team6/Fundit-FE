import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";
import { BuyerLiveRoom } from "./buyer-live-room";

const meta = {
  title: "Features/BuyerLive/Room",
  component: BuyerLiveRoom,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen", nextjs: { appDirectory: true } },
  args: { liveId: "demo-live" },
} satisfies Meta<typeof BuyerLiveRoom>;
export default meta;
type Story = StoryObj<typeof meta>;

export const NoticeDismiss: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "펀딩하기" }));
    expect(canvas.getByRole("status")).toHaveTextContent("연결된 프로젝트 정보가 없는 목업");
    await waitFor(() => expect(canvas.getByRole("status")).toBeEmptyDOMElement(), {
      timeout: 5000,
    });
  },
};

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByRole("button", { name: "메시지 전송" })).toBeDisabled();
    const follow = canvas.getByRole("button", { name: "팔로우" });
    await userEvent.click(follow);
    expect(follow).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(follow);
    expect(follow).toHaveAttribute("aria-pressed", "false");
    const like = canvas.getByRole("button", { name: "좋아요" });
    await userEvent.click(like);
    expect(like).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(like);
    expect(like).toHaveAttribute("aria-pressed", "false");
    expect(canvas.getByRole("link", { name: "라이브 나가기" })).toHaveAttribute("href", "/live");
  },
};

export const ExpandedChat: Story = {
  args: { initialChatExpanded: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const chat = canvas.getByRole("log", { name: "라이브 채팅 메시지" });
    expect(chat.getBoundingClientRect().height).toBe(280);
    await userEvent.click(chat);
    expect(chat.getBoundingClientRect().height).toBe(120);
    const toggle = canvas.getByRole("button", { name: "채팅 확대" });
    toggle.focus();
    await userEvent.keyboard("{Enter}");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle).toHaveAttribute("aria-controls", chat.id);
    expect(chat.closest("button")).toBeNull();
    expect(chat).toHaveAttribute("aria-live", "polite");
  },
};

export const Questions: Story = {
  args: { initialQuestions: "compact" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dialog = await canvas.findByRole("dialog");
    expect(dialog).toHaveAccessibleName("Q&A");
    expect(within(dialog).getAllByRole("article")).toHaveLength(4);
  },
};

export const ExpandedQuestions: Story = {
  args: { initialQuestions: "expanded" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dialog = await canvas.findByRole("dialog");
    expect(dialog.getBoundingClientRect().top).toBe(64);
    expect(canvas.getByRole("button", { name: "Q&A 축소" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  },
};

export const QuestionNavigation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Q&A" });
    await userEvent.click(trigger);
    const dialog = await canvas.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Q&A 확대" }));
    expect(dialog.getBoundingClientRect().top).toBe(64);
    await userEvent.keyboard("{Escape}");
    expect(dialog).not.toBeVisible();
    expect(trigger).toHaveFocus();
  },
};

export const MessageInput: Story = {
  args: { initialChatExpanded: true, initialMessage: "로보락\n너는" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "메시지 입력" });
    await userEvent.click(input);
    expect(canvas.getByRole("button", { name: "채팅 확대" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    expect(input).toHaveValue("로보락\n너는");
    await userEvent.click(canvas.getByRole("button", { name: "메시지 전송" }));
    expect(input).toHaveValue("");
    expect(input).toHaveFocus();
    expect(canvas.getByRole("log")).toHaveTextContent("로보락 너는");
  },
};

export const BlockedMessage: Story = {
  args: { initialMessage: "로보락\n너는\n바보야" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "메시지 입력" });
    await userEvent.click(canvas.getByRole("button", { name: "메시지 전송" }));
    expect(canvas.getByRole("alert")).toHaveTextContent("메시지를 전송할 수 없습니다");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveValue("로보락\n너는\n바보야");
    await userEvent.clear(input);
    await userEvent.type(input, "좋아요{Enter}");
    expect(input).toHaveValue("");
    expect(canvas.queryByRole("alert")).not.toBeInTheDocument();
    expect(canvas.getByRole("log")).toHaveTextContent("좋아요");
    await userEvent.type(input, "바보{Enter}");
    expect(canvas.getByRole("alert")).toBeVisible();
    expect(canvas.getByRole("status")).toBeEmptyDOMElement();
  },
};
