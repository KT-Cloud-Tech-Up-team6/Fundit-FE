import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "@/shared/components/ui/button";
import { demoProjectTitle, storyFixture } from "../model/story-demo";
import type { StoryStage } from "../model/story-demo";
import { FundingStoryEditor } from "./funding-story-editor";
import { FundingStoryModal } from "./funding-story-modal";

function StoryDemo({
  stage = "description",
  pauseDemo = false,
}: {
  stage?: StoryStage;
  pauseDemo?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const [imported, setImported] = useState("");
  return (
    <div className="p-6">
      <Button onClick={() => setOpen(true)}>AI 스토리 열기</Button>
      <p className="mt-4 whitespace-pre-wrap" role="status">
        {imported}
      </p>
      {open && (
        <FundingStoryModal
          key={stage}
          projectTitle={demoProjectTitle}
          initialState={storyFixture(stage)}
          pauseDemo={pauseDemo}
          onClose={() => setOpen(false)}
          onImport={(body) => {
            setImported(body);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

const meta = {
  title: "Features/Funding AI Story",
  component: StoryDemo,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta<typeof StoryDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Initial: Story = {};
export const Questions: Story = { args: { stage: "questions" } };
export const Summarizing: Story = { args: { stage: "summarizing", pauseDemo: true } };
export const Summary: Story = { args: { stage: "summary" } };
export const Generating: Story = { args: { stage: "generating", pauseDemo: true } };
export const Ready: Story = { args: { stage: "ready", pauseDemo: true } };
export const Result: Story = { args: { stage: "result" } };
export const Editor: Story = {
  render: () => (
    <div className="mx-auto max-w-300 px-5">
      <FundingStoryEditor projectId="demo-story" />
    </div>
  ),
};

function StageChangeDemo() {
  const [stage, setStage] = useState<StoryStage>("description");
  return (
    <>
      <button type="button" onClick={() => setStage("questions")}>
        질문 단계로 변경
      </button>
      <button type="button" onClick={() => setStage("description")}>
        설명 단계로 변경
      </button>
      <StoryDemo stage={stage} />
    </>
  );
}

export const StageChangeResetsModal: Story = {
  render: () => <StageChangeDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = await canvas.findByRole("textbox", { name: "스토리 메시지" });
    await userEvent.type(input, "이전 단계의 미전송 입력");
    // 모달 밖 Storybook Controls의 props 변경을 재현합니다.
    canvas.getByRole("button", { name: "질문 단계로 변경", hidden: true }).click();
    await waitFor(() => {
      expect(canvas.getByRole("button", { name: "해당 사항 없음" })).toBeVisible();
      expect(canvas.getByRole("textbox", { name: "스토리 메시지" })).toHaveValue("");
    });
    canvas.getByRole("button", { name: "설명 단계로 변경", hidden: true }).click();
    await waitFor(() => {
      expect(canvas.queryByRole("button", { name: "해당 사항 없음" })).not.toBeInTheDocument();
      expect(canvas.getByRole("textbox", { name: "스토리 메시지" })).toHaveValue("");
    });
  },
};

export const IndependentEditors: Story = {
  render: () => (
    <>
      <FundingStoryEditor projectId="first-story" />
      <FundingStoryEditor projectId="second-story" />
    </>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const inputs = canvas.getAllByRole("textbox", { name: "프로젝트 소개" });
    const headings = canvas.getAllByRole("heading", { name: "스토리 작성" });
    expect(inputs).toHaveLength(2);
    expect(new Set(inputs.map((input) => input.id)).size).toBe(2);
    expect(new Set(headings.map((heading) => heading.id)).size).toBe(2);
    await userEvent.clear(inputs[1]);
    await userEvent.type(inputs[1], "두 번째 프로젝트 본문");
    expect(inputs[1]).toHaveValue("두 번째 프로젝트 본문");
    expect(inputs[0]).not.toHaveValue("두 번째 프로젝트 본문");
  },
};
