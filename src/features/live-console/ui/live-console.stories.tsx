import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { LiveConsole } from "./live-console";

const meta = {
  title: "Features/LiveConsole/Console",
  component: LiveConsole,
  parameters: { layout: "fullscreen", nextjs: { appDirectory: true } },
  tags: ["autodocs"],
  render: (args) => <LiveConsole key={JSON.stringify(args)} {...args} />,
} satisfies Meta<typeof LiveConsole>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {
  args: { initialView: "loading" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "스트림 상태 확인" }));
    const status = canvas.getByRole("status");
    await expect(status).toHaveTextContent("스트리밍 서버에 연결되어 있지 않습니다.");
    await expect(status).toBeVisible();
    expect(status.getBoundingClientRect().height).toBeGreaterThan(1);
  },
};
export const Broadcasting: Story = { args: { initialView: "live" } };
export const UnavailableQuestionCard: Story = {
  args: { initialView: "live" },
  play: async ({ canvasElement }) => {
    const manager = within(canvasElement).getByRole("region", { name: "AI 라이브 매니저" });
    const canvas = within(manager);
    const title = "F25 'Ultra'와 'ACE' 모델의 가장 큰 차이점은 무엇인가요?";
    const question = canvas.getByRole("button", { name: `${title} 추천 답변 생성 불가` });
    expect(question.closest("li")).toHaveClass("border-border-accent-warning");
    const count = canvas.getByRole("button", { name: `${title} 질문 전체 보기 6건` });
    expect(count).toHaveClass("bg-status-warning", "text-text-warning");
    await userEvent.click(count);
    expect(canvas.getByRole("list", { name: "질문 원문 목록" }).children).toHaveLength(6);
    await userEvent.click(canvas.getByRole("button", { name: "돌아가기" }));
    await userEvent.click(canvas.getByRole("button", { name: `${title} 추천 답변 생성 불가` }));
    expect(canvas.getByText(/상품 정보가 부족해/)).toBeVisible();
    expect(canvas.queryByRole("button", { name: "채팅 보내기" })).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "답변 완료 처리" }));
    expect(canvas.getByRole("button", { name: title }).closest("li")).toHaveClass(
      "bg-layer-surface-disabled",
    );
    expect(canvas.getByRole("button", { name: title }).closest("li")).not.toHaveClass(
      "border-border-accent-warning",
    );
    expect(canvas.getByRole("button", { name: "집계된 Q&A 보기 (2)" })).toBeVisible();
  },
};
export const AggregatedAnswers: Story = { args: { initialView: "aggregated" } };
export const AllQuestions: Story = { args: { initialView: "originals" } };
export const SuggestedAnswer: Story = { args: { initialView: "answer" } };
export const AnswerUnavailable: Story = { args: { initialView: "unavailable" } };
export const CueCollapsed: Story = { args: { initialView: "cue-collapsed" } };
export const BroadcastEnded: Story = { args: { initialView: "ended" } };
export const CheckSelection: Story = { args: { initialView: "check" } };
export const SentAnswer: Story = { args: { initialView: "check-detail" } };

export const PublishSelectedAnswers: Story = {
  args: { initialView: "check" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dialog = within(await canvas.findByRole("dialog"));
    await userEvent.click(dialog.getAllByRole("checkbox")[0]);
    await userEvent.click(dialog.getByRole("button", { name: "LIVE 체크 추가(1)" }));
    const added = within(await canvas.findByRole("dialog"));
    await expect(added.getByText("LIVE 체크 추가 완료")).toBeVisible();
    await expect(added.getByRole("link", { name: "상세페이지로" })).toHaveAttribute(
      "href",
      "/projects/demo-project?tab=live-proof",
    );
    await userEvent.click(added.getByRole("button", { name: "나가기" }));
    await expect(canvas.queryByRole("dialog")).not.toBeInTheDocument();
  },
};

export const CheckAdded: Story = { args: { initialView: "added" } };

export const IndependentCuePanels: Story = {
  render: () => (
    <>
      <LiveConsole liveId="first" />
      <LiveConsole liveId="second" />
    </>
  ),
  play: async ({ canvasElement }) => {
    const panels = within(canvasElement).getAllByRole("region", { name: "큐시트" });
    const outlines = panels.map((panel) => within(panel).getByRole("list"));
    await expect(outlines[0].id).not.toBe(outlines[1].id);
    for (const [index, panel] of panels.entries()) {
      const toggle = within(panel).getByRole("button", { name: "접기" });
      await expect(toggle).toHaveAttribute("aria-controls", outlines[index].id);
    }
    await userEvent.click(within(panels[0]).getByRole("button", { name: "접기" }));
    await expect(within(panels[0]).getByRole("button", { name: "펼치기" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await expect(within(panels[1]).getByRole("button", { name: "접기" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  },
};
