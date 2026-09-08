import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "@/shared/components/ui/button";
import { demoProjectTitle, storyFixture } from "../model/story-demo";
import type { StoryStage } from "../model/story-demo";
import { FundingStoryEditor } from "./funding-story-editor";
import { FundingStoryModal } from "./funding-story-modal";
import { ProjectStoryForm } from "@/features/project-story/ui/project-story-form";

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

function expectCta(element: HTMLElement) {
  const style = getComputedStyle(element);
  expect(style.fontSize).toBe("16px");
  expect(style.fontWeight).toBe("600");
  expect(style.lineHeight).toBe("24px");
}

export const Initial: Story = {};
export const InputHeightLimit: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = await canvas.findByRole("textbox", { name: "스토리 메시지" });
    await userEvent.click(input);
    await userEvent.paste(Array.from({ length: 30 }, (_, i) => `제품 설명 ${i + 1}`).join("\n"));
    await waitFor(() => {
      expect(input.getBoundingClientRect().height).toBe(160);
      expect(input.closest("form")?.getBoundingClientRect().height).toBe(178);
      expect(input.scrollHeight).toBeGreaterThan(input.clientHeight);
    });
    await userEvent.click(canvas.getByRole("button", { name: "메시지 보내기" }));
    await waitFor(() => {
      expect(input).toHaveValue("");
      expect(input.getBoundingClientRect().height).toBe(24);
    });
  },
};
export const Questions: Story = {
  args: { stage: "questions" },
  play: async ({ canvasElement }) => {
    expectCta(await within(canvasElement).findByRole("button", { name: "해당 사항 없음" }));
  },
};
export const Summarizing: Story = { args: { stage: "summarizing", pauseDemo: true } };
export const Summary: Story = {
  args: { stage: "summary" },
  play: async ({ canvasElement }) => {
    expectCta(await within(canvasElement).findByRole("button", { name: "그대로 생성하기" }));
  },
};
export const Generating: Story = { args: { stage: "generating", pauseDemo: true } };
export const Ready: Story = { args: { stage: "ready", pauseDemo: true } };
export const Result: Story = {
  args: { stage: "result" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const name of ["이전으로", "재생성", "불러오기"]) {
      expectCta(await canvas.findByRole("button", { name }));
    }
  },
};
export const Editor: Story = {
  render: () => (
    <div className="mx-auto max-w-300 px-5">
      <FundingStoryEditor projectId="demo-story" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const name of ["찾아 보기", "AI로 펀딩 스토리 작성", "미리보기", "임시저장", "저장"]) {
      expectCta(canvas.getByRole("button", { name }));
    }
  },
};

export const IntegratedEditor: Story = {
  render: () => (
    <div className="mx-auto max-w-198 p-5">
      <ProjectStoryForm />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const name of [
      "썸네일 이미지 파일 선택",
      "AI로 펀딩 스토리 작성",
      "미리보기",
      "임시저장",
      "저장",
    ]) {
      expectCta(canvas.getByRole("button", { name }));
    }
    await userEvent.click(canvas.getByRole("button", { name: "AI로 펀딩 스토리 작성" }));
    expect(await canvas.findByRole("log", { name: "스토리 작성 대화" })).toBeVisible();
  },
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
