import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState, type ComponentProps } from "react";
import { expect, fireEvent, fn, userEvent, waitFor, within } from "storybook/test";
import type { LiveChatMessage, LiveChatSendResult } from "../model/live-chat";
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
    await userEvent.click(canvas.getByRole("button", { name: "리워드 5개 이상 더보기" }));
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
    expect(chat.getBoundingClientRect().height).toBe(156);
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
    expect(within(dialog).getAllByRole("article")).toHaveLength(5);
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
    await userEvent.click(within(dialog).getByRole("button", { name: "Q&A 닫기" }));
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

/* 아래는 실제 LIVE 채팅(#470) 표시다. 작성자는 시청자·나·판매자, 판매자 답변은 @everyone, AI 답변은
   "AI 매니저" 윗줄 라벨과 초록 본문(Figma 295:50452)이다. 전송 결과는 서버 응답을 흉내 낸다. */
const liveChatRows: LiveChatMessage[] = [
  { id: "1", author: "시청자", text: "배송은 언제 시작되나요?" },
  { id: "2", author: "판매자", text: "오늘 방송 시작합니다!" },
  { id: "3", author: "나", text: "물걸레 건조 모드가 있나요?" },
  { id: "4", author: "판매자", text: "@everyone 네, 물걸레 건조 모드를 지원합니다." },
  {
    id: "5",
    author: "AI 매니저",
    text: "미세 거품을 분사해 찌든 때를 불려 쉽게 닦아내는 기능입니다.",
    ai: true,
  },
];

function LiveChatRoom({
  result,
  ...props
}: ComponentProps<typeof BuyerLiveRoom> & { result: LiveChatSendResult }) {
  const [messages, setMessages] = useState(liveChatRows);
  return (
    <BuyerLiveRoom
      {...props}
      demoMode={false}
      liveChat={{
        messages,
        maxLength: 500,
        onSend: async (text) => {
          if (result === "sent")
            setMessages((current) => [
              ...current,
              { id: String(current.length + 1), author: "나", text },
            ]);
          return result;
        },
      }}
    />
  );
}

export const LiveChat: Story = {
  render: (args) => <LiveChatRoom {...args} result="sent" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const log = canvas.getByRole("log", { name: "라이브 채팅 메시지" });
    expect(log).toHaveTextContent("시청자배송은 언제 시작되나요?");
    expect(log).toHaveTextContent("판매자@everyone 네, 물걸레 건조 모드를 지원합니다.");
    const ai = within(log).getByText("AI 매니저").parentElement;
    expect(ai).toHaveAttribute("data-ai", "true");
    const input = canvas.getByRole("textbox", { name: "메시지 입력" });
    expect(input).toHaveAttribute("maxlength", "500");
    await userEvent.type(input, "바보 아니에요{Enter}");
    // 실제 채팅은 FE 단어 목록으로 막지 않는다. 서버가 되돌려주면 입력을 비운다.
    await waitFor(() => expect(input).toHaveValue(""));
    expect(canvas.queryByRole("alert")).not.toBeInTheDocument();
    expect(log).toHaveTextContent("나바보 아니에요");
  },
};

export const LiveChatGuest: Story = {
  args: {
    demoMode: false,
    liveChat: { messages: [], maxLength: 500, onSend: fn(), onRequireLogin: fn() },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    expect(canvas.queryByRole("textbox", { name: "메시지 입력" })).not.toBeInTheDocument();
    expect(canvas.getByRole("log", { name: "라이브 채팅 메시지" })).toBeEmptyDOMElement();
    await userEvent.click(canvas.getByRole("button", { name: "로그인하고 메시지 입력" }));
    expect(args.liveChat?.onRequireLogin).toHaveBeenCalledTimes(1);
    expect(canvas.getByRole("button", { name: "메시지 전송" })).toBeDisabled();
  },
};

export const LiveChatRejected: Story = {
  render: (args) => <LiveChatRoom {...args} result="rejected" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "메시지 입력" });
    await userEvent.type(input, "거절될 메시지{Enter}");
    expect(await canvas.findByRole("alert")).toHaveTextContent("메시지를 전송할 수 없습니다");
    expect(input).toHaveValue("거절될 메시지");
    expect(input).toHaveAttribute("aria-invalid", "true");
    await userEvent.type(input, "!");
    expect(canvas.queryByRole("alert")).not.toBeInTheDocument();
  },
};

export const LiveChatSendFailed: Story = {
  render: (args) => <LiveChatRoom {...args} result="failed" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "메시지 입력" });
    await userEvent.type(input, "연결이 끊긴 메시지{Enter}");
    await waitFor(() =>
      expect(canvas.getByRole("status")).toHaveTextContent(
        "메시지를 보내지 못했습니다. 다시 시도해주세요.",
      ),
    );
    expect(input).toHaveValue("연결이 끊긴 메시지");
    expect(canvas.queryByRole("alert")).not.toBeInTheDocument();
  },
};
