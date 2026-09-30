import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState, type ComponentProps } from "react";
import { expect, fireEvent, fn, userEvent, waitFor, within } from "storybook/test";
import type { LiveChatMessage, LiveChatSendResult } from "../model/live-chat";
import { BuyerLiveDesktop } from "./buyer-live-desktop";
import { LiveRewardSummary } from "@/features/reward-selection/ui/live-reward-summary";
import { questionDemos } from "@/features/buyer-project/model/project-demo";
import { chapterDemos } from "@/features/buyer-live-replay/model/replay-demo";

const meta = {
  title: "Features/BuyerLive/Desktop",
  component: BuyerLiveDesktop,
  parameters: { layout: "fullscreen", nextjs: { appDirectory: true } },
  args: {
    liveId: "demo-live",
    questions: questionDemos,
    chapters: chapterDemos.map((chapter, index) => ({
      ...chapter,
      progress: [0, 50, 75, 90][index],
    })),
    rewardSummary: <LiveRewardSummary projectId="demo-project" />,
  },
} satisfies Meta<typeof BuyerLiveDesktop>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Live: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "팔로우" }));
    expect(canvas.getByRole("button", { name: "팔로잉" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(canvas.getByRole("button", { name: "좋아요" }));
    expect(canvas.getByRole("button", { name: "좋아요 취소" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(canvas.getByRole("link", { name: "상세 정보 보기" })).toHaveAttribute(
      "href",
      "/projects/demo-project?tab=story",
    );
  },
};
export const Questions: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Q&A" });
    await userEvent.click(trigger);
    const dialog = await canvas.findByRole("dialog", { name: "Q&A" });
    expect(within(dialog).getAllByRole("article")).toHaveLength(5);
    await userEvent.click(within(dialog).getByRole("button", { name: "Q&A 닫기" }));
    await waitFor(() => expect(dialog).not.toBeVisible());
    expect(trigger).toHaveFocus();
  },
};
export const BlockedMessage: Story = {
  args: { initialMessage: "로보락 너는 멍청이" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "메시지 입력" });
    await userEvent.click(canvas.getByRole("button", { name: "메시지 전송" }));
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(canvas.getByRole("alert")).toHaveTextContent("메시지를 전송할 수 없습니다");
    expect(
      within(canvas.getByRole("log")).queryByText("로보락 너는 멍청이"),
    ).not.toBeInTheDocument();
    await userEvent.clear(input);
    await userEvent.type(input, "배송이 궁금합니다");
    await userEvent.keyboard("{Enter}");
    expect(within(canvas.getByRole("log")).getByText("배송이 궁금합니다")).toBeVisible();
    expect(input).toHaveValue("");
  },
};
export const ReplayChat: Story = {
  args: { replay: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "메시지 입력" });
    await userEvent.type(input, "한글 조합");
    fireEvent.keyDown(input, { key: "Enter", code: "Enter", isComposing: true, keyCode: 229 });
    expect(input).toHaveValue("한글 조합");
    expect(within(canvas.getByRole("log")).queryByText("한글 조합")).not.toBeInTheDocument();
    await userEvent.keyboard("{Shift>}{Enter}{/Shift}다음 줄");
    expect(input).toHaveValue("한글 조합\n다음 줄");
    await userEvent.click(canvas.getByRole("button", { name: "메시지 전송" }));
    expect(within(canvas.getByRole("log")).getByText("한글 조합 다음 줄")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "타임라인" }));
    await userEvent.click(canvas.getByRole("button", { name: "채팅" }));
    expect(within(canvas.getByRole("log")).getByText("한글 조합 다음 줄")).toBeVisible();
  },
};
export const Chapters: Story = {
  args: { replay: true, initialPanel: "chapters" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByRole("button", { name: "이전 구간" })).toBeDisabled();
    await userEvent.click(canvas.getByRole("button", { name: "다음 구간" }));
    expect(canvas.getByRole("slider")).toHaveValue("50");
    await userEvent.click(canvas.getByRole("button", { name: "일시정지" }));
    await userEvent.click(canvas.getByRole("button", { name: "구간 3 재생" }));
    expect(canvas.getByRole("button", { name: "일시정지" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "다음 구간" }));
    expect(canvas.getByRole("button", { name: "다음 구간" })).toBeDisabled();
    expect(canvas.getByRole("button", { name: "일시정지" })).toHaveFocus();
    expect(canvas.getByRole("slider")).toHaveValue("90");
  },
};
export const Clip: Story = {
  args: { replay: true, clip: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText("시연 영상")).toBeVisible();
    expect(canvas.getByRole("button", { name: "타임라인" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(canvas.getByText("물걸레+진공")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Q&A" }));
    expect(await canvas.findByRole("dialog", { name: "Q&A" })).toBeVisible();
  },
};

/* 아래는 실제 LIVE 채팅(#470) 표시다. 실제 경로는 리워드가 없어도 오른쪽 열에 채팅 패널과 입력을 그린다.
   작성자는 닉네임(없으면 시청자)·나·판매자이고 긴 닉네임은 줄의 절반에서 말줄임한다(#488). 판매자 답변은
   @everyone, AI 답변은 "AI 매니저" 윗줄 라벨과 초록 본문이다. */
const liveChatRows: LiveChatMessage[] = [
  { id: "1", author: "펀딧러버", text: "f25 흡입력이랑 물걸레 동시 작동할 때 소음은 어떤가요?" },
  { id: "2", author: "판매자", text: "오늘 방송 시작합니다!" },
  { id: "3", author: "나", text: "물걸레 건조 모드가 있나요?" },
  { id: "4", author: "판매자", text: "@everyone 네, 물걸레 건조 모드를 지원합니다." },
  {
    id: "5",
    author: "AI 매니저",
    text: "미세 거품을 분사해 찌든 때를 불려 쉽게 닦아내는 기능입니다.",
    ai: true,
  },
  { id: "6", author: "청소가제일쉬운무선청소기러버입니다", text: "저도 궁금했어요" },
  { id: "7", author: "시청자", text: "닉네임을 받지 못한 시청자" },
];
const liveArgs = {
  demoMode: false,
  rewardSummary: null,
  chapters: [],
  seller: { name: "홈메이트랩", following: false, onToggleFollow: fn() },
};

function LiveChatDesktop({
  result,
  ...props
}: ComponentProps<typeof BuyerLiveDesktop> & { result: LiveChatSendResult }) {
  const [messages, setMessages] = useState(liveChatRows);
  return (
    <BuyerLiveDesktop
      {...props}
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
  args: liveArgs,
  render: (args) => <LiveChatDesktop {...args} result="sent" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const panel = canvas.getByRole("region", { name: "실시간 채팅" });
    const log = within(panel).getByRole("log", { name: "채팅 메시지" });
    expect(log).toHaveTextContent("펀딧러버f25 흡입력이랑");
    expect(log).toHaveTextContent("판매자@everyone 네, 물걸레 건조 모드를 지원합니다.");
    expect(within(log).getByText(/미세 거품을/)).toHaveClass("text-text-success");
    // 긴 닉네임은 줄의 절반에서 말줄임한다(#488).
    const longName = within(log).getByText("청소가제일쉬운무선청소기러버입니다");
    expect(getComputedStyle(longName).textOverflow).toBe("ellipsis");
    expect(longName.clientWidth).toBeLessThanOrEqual(longName.parentElement!.clientWidth / 2 + 1);
    // 실제 경로는 채팅 수 배지를 그리지 않는다.
    expect(within(panel).queryByText("53")).not.toBeInTheDocument();
    const input = within(panel).getByRole("textbox", { name: "메시지 입력" });
    await userEvent.type(input, "배송이 궁금합니다{Enter}");
    await waitFor(() => expect(input).toHaveValue(""));
    expect(log).toHaveTextContent("나배송이 궁금합니다");
  },
};

export const LiveChatGuest: Story = {
  args: {
    ...liveArgs,
    liveChat: { messages: liveChatRows, maxLength: 500, onSend: fn(), onRequireLogin: fn() },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    expect(canvas.queryByRole("textbox", { name: "메시지 입력" })).not.toBeInTheDocument();
    // 비로그인도 보기 전용으로 채팅을 본다(#488).
    expect(canvas.getByRole("log", { name: "채팅 메시지" })).toHaveTextContent(
      "펀딧러버f25 흡입력이랑",
    );
    await userEvent.click(canvas.getByRole("button", { name: "로그인하고 메시지 입력" }));
    expect(args.liveChat?.onRequireLogin).toHaveBeenCalledTimes(1);
  },
};

export const LiveChatRejected: Story = {
  args: liveArgs,
  render: (args) => <LiveChatDesktop {...args} result="rejected" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "메시지 입력" });
    await userEvent.type(input, "거절될 메시지{Enter}");
    expect(await canvas.findByRole("alert")).toHaveTextContent("메시지를 전송할 수 없습니다");
    expect(input).toHaveValue("거절될 메시지");
    expect(input).toHaveAttribute("aria-invalid", "true");
  },
};

export const LiveChatSendFailed: Story = {
  args: liveArgs,
  render: (args) => <LiveChatDesktop {...args} result="failed" />,
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
  },
};
