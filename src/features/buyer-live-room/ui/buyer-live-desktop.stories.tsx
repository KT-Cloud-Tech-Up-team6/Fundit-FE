import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";
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
