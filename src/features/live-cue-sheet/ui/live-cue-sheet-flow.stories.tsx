import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { createDemoScenes, demoAnswers } from "../model/cue-sheet-demo";
import { LiveCueSheetFlow, type CueSheetGenerationView } from "./live-cue-sheet-flow";

const meta = {
  title: "Features/LiveCueSheet/Flow",
  component: LiveCueSheetFlow,
  parameters: { layout: "fullscreen" },
  render: (args) => <LiveCueSheetFlow key={JSON.stringify(args)} {...args} />,
} satisfies Meta<typeof LiveCueSheetFlow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Chat: Story = {};
export const Closed: Story = { args: { initialStep: "closed" } };
export const TypeSelection: Story = { args: { initialStep: "options" } };
export const Editor: Story = { args: { initialStep: "editor" } };

export const ChatComplete: Story = {
  args: { initialStep: "chat", initialAnswers: demoAnswers },
};

export const Summary: Story = {
  args: { initialStep: "summary", initialAnswers: demoAnswers },
};

export const TypeSelected: Story = {
  args: {
    initialStep: "options",
    initialAnswers: demoAnswers,
    initialType: "script",
    initialMinutes: 10,
  },
};

export const Generating: Story = {
  args: {
    ...TypeSelected.args,
    initialStep: "generating",
    autoAdvanceGeneration: false,
  },
  parameters: {
    docs: { description: { story: "생성 중 화면을 검토할 수 있도록 자동 전환을 멈춥니다." } },
  },
};

export const GenerationComplete: Story = {
  args: { ...Generating.args, initialStep: "ready" },
  parameters: {
    docs: { description: { story: "생성 완료 화면을 검토할 수 있도록 자동 전환을 멈춥니다." } },
  },
};

const failedGeneration = {
  phase: "failed",
  scenes: [],
  type: "script",
  minutes: 10,
  failureReason: "AI 서버가 응답하지 않았습니다. (timeout)",
} satisfies CueSheetGenerationView;

/* FL_S_LVS_AIC_FAIL — 서버가 FAILED와 사유를 내려준 경우. `generation`을 주면 API 모드로
   동작해 단계 전환을 서버 상태가 끈다(`live-cue-sheet-flow.tsx` 주석 참고). */
export const GenerationFailed: Story = {
  args: {
    ...TypeSelected.args,
    /* 단계 전환은 phase가 "바뀔 때"만 걸린다. 처음부터 failed인 스토리는
       initialStep도 함께 줘야 실패 화면에서 멈춘다. */
    initialStep: "failed",
    onGenerate: () => {},
    generation: failedGeneration,
  },
  parameters: {
    docs: { description: { story: "서버가 준 `failureReason`을 그대로 싣는 실패 화면." } },
  },
};

/* 사유 없이 FAILED만 온 경우 — 기본 문구로 대체되는지 확인한다. */
export const GenerationFailedWithoutReason: Story = {
  args: {
    ...TypeSelected.args,
    initialStep: "failed",
    onGenerate: () => {},
    generation: { ...failedGeneration, failureReason: null },
  },
  parameters: {
    docs: { description: { story: "사유가 없으면 “잠시 후 다시 시도해 주세요.”로 대체한다." } },
  },
};

export const Saved: Story = {
  args: {
    initialStep: "closed",
    initialAnswers: demoAnswers,
    initialSavedCueSheet: {
      scenes: createDemoScenes(10, demoAnswers),
      type: "script",
      minutes: 10,
    },
  },
};
