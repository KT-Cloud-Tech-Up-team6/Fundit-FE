import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState, type ComponentProps } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { SellerChatPanel } from "./console-panels";

/* 실제 콘솔(#470)의 채팅창. 판매자 본인 메시지도 "판매자"이고, "채팅 보내기"로 BE가 올린 답변은
   "판매자 @everyone 본문"(Prototype 170:72652), AI 답변은 "AI 매니저" 윗줄 라벨과 초록 본문이다.
   채팅 수는 이 화면에서 받은 수다. 시청자는 닉네임(없으면 시청자)이고 긴 닉네임은 줄의 절반에서
   말줄임한다(#488). */
const messages = [
  { id: "1", author: "펀딧러버", text: "지금 구매하면 사은품 언제 같이 배송되나요?" },
  { id: "1-1", author: "청소가제일쉬운무선청소기러버입니다", text: "저도 궁금했어요" },
  { id: "2", author: "판매자", text: "사은품은 본품과 함께 발송됩니다." },
  {
    id: "3",
    author: "판매자",
    text: "@everyone 네, 가능합니다. 로보락 F25는 물걸레 건조 모드를 지원합니다.",
  },
  {
    id: "4",
    author: "AI 매니저",
    text: "미세 거품을 분사해 찌든 때를 불려 쉽게 닦아내는 기능입니다.",
    ai: true,
  },
];

const meta = {
  title: "Features/LiveConsole/SellerChatPanel",
  component: SellerChatPanel,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="w-[386px]">
        <Story />
      </div>
    ),
  ],
  args: { messages, maxLength: 500, onSend: () => true },
} satisfies Meta<typeof SellerChatPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

function LiveSellerChat({
  sent,
  ...props
}: ComponentProps<typeof SellerChatPanel> & { sent: boolean }) {
  const [rows, setRows] = useState(props.messages);
  return (
    <SellerChatPanel
      {...props}
      messages={rows}
      onSend={async (text) => {
        if (sent)
          setRows((current) => [
            ...current,
            { id: String(current.length + 1), author: "판매자", text: text.trim() },
          ]);
        return sent;
      }}
    />
  );
}

export const LiveChat: Story = {
  render: (args) => <LiveSellerChat {...args} sent />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const log = canvas.getByRole("log", { name: "채팅 내역" });
    expect(within(log).getAllByText("판매자")).toHaveLength(2);
    expect(within(log).getByText(/미세 거품을/)).toHaveClass("text-text-success");
    expect(canvas.getByLabelText("채팅 5개")).toBeVisible();
    // 긴 닉네임은 줄의 절반에서 말줄임한다(#488).
    const longName = within(log).getByText("청소가제일쉬운무선청소기러버입니다");
    expect(getComputedStyle(longName).textOverflow).toBe("ellipsis");
    expect(longName.clientWidth).toBeLessThanOrEqual(longName.parentElement!.clientWidth / 2 + 1);
    const input = canvas.getByRole("textbox", { name: "판매자 채팅 입력" });
    expect(input).toHaveAttribute("maxlength", "500");
    await userEvent.type(input, "오늘 방송 시작합니다{Enter}");
    await waitFor(() => expect(input).toHaveValue(""));
    expect(within(log).getByText("오늘 방송 시작합니다")).toBeVisible();
  },
};

export const SendFailed: Story = {
  render: (args) => <LiveSellerChat {...args} sent={false} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "판매자 채팅 입력" });
    await userEvent.type(input, "보내지 못한 메시지{Enter}");
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "채팅 전송" })).not.toBeDisabled(),
    );
    expect(input).toHaveValue("보내지 못한 메시지");
  },
};

export const Empty: Story = {
  args: { messages: [], countLabel: "0" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText("아직 채팅이 없습니다")).toBeVisible();
    expect(canvas.getByLabelText("채팅 0개")).toBeVisible();
  },
};
