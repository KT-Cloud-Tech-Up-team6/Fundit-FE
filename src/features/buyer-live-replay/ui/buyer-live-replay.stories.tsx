import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { BuyerLiveReplay } from "./buyer-live-replay";

const meta = {
  title: "Features/BuyerLive/Replay",
  component: BuyerLiveReplay,
  parameters: { layout: "fullscreen", nextjs: { appDirectory: true } },
  args: { liveId: "demo-live" },
} satisfies Meta<typeof BuyerLiveReplay>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByRole("button", { name: "채팅" })).toHaveAttribute("aria-pressed", "true");
    expect(canvas.getByRole("region", { name: "다시보기 채팅 기록" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "팔로우" }));
    expect(canvas.getByRole("button", { name: "팔로잉" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(canvas.getByRole("button", { name: "펀딩하기" }));
    expect(canvas.getByRole("status")).toHaveTextContent("연결된 프로젝트 정보가 없는 목업");
  },
};
export const Chapters: Story = {
  args: { initialPanel: "chapters" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getAllByRole("button", { name: /구간 \d 재생/ })).toHaveLength(4);
    expect(canvas.getByRole("button", { name: "구간 1 재생" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await userEvent.click(canvas.getByRole("button", { name: "일시정지" }));
    await userEvent.click(canvas.getByRole("button", { name: "구간 2 재생" }));
    expect(canvas.getByRole("button", { name: "구간 2 재생" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(canvas.getByRole("slider")).toHaveValue("25");
    expect(canvas.getByRole("button", { name: "일시정지" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "다음 구간" }));
    expect(canvas.getByRole("slider")).toHaveValue("50");
    await userEvent.click(canvas.getByRole("button", { name: "채팅" }));
    expect(canvas.queryByRole("region", { name: "영상 구간 목록" })).not.toBeInTheDocument();
  },
};
export const Clip: Story = {
  args: { clip: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText("시연 영상")).toBeVisible();
    expect(canvas.queryByRole("slider")).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "좋아요" }));
    expect(canvas.getByRole("button", { name: "좋아요" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(canvas.getByRole("button", { name: "채팅" }));
    expect(canvas.getByRole("status")).toHaveTextContent("숏 클립 채팅은 아직 연결되지 않은 목업");
  },
};
