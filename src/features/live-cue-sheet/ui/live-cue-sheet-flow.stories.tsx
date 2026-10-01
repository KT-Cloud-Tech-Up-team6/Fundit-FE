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
/* FL_S_LVS_AISLT_1 — 유형·시간을 고르기 전. */
export const TypeSelection: Story = { args: { initialStep: "options" } };
/* FL_S_LVS_AISLT_5 — 대사 완성 유형 편집. */
export const Editor: Story = { args: { initialStep: "editor" } };
/* 시나리오 유형 편집. 대사 칸 없이 개요만 고친다. */
export const EditorScenario: Story = { args: { initialStep: "editor", initialType: "scenario" } };

export const ChatComplete: Story = {
  args: { initialStep: "chat", initialAnswers: demoAnswers },
};

export const Summary: Story = {
  args: { initialStep: "summary", initialAnswers: demoAnswers },
};

/* FL_S_LVS_AISLT_2 — 유형만 골라 버튼은 아직 "다음으로" 비활성이다. */
export const TypeSelectedWithoutMinutes: Story = {
  args: { initialStep: "options", initialAnswers: demoAnswers, initialType: "script" },
};

/* FL_S_LVS_AISLT_3 — 유형과 시간을 다 골라 "큐시트 생성"이 켜진다. */
export const TypeSelected: Story = {
  args: {
    initialStep: "options",
    initialAnswers: demoAnswers,
    initialType: "script",
    initialMinutes: 10,
  },
};

/* FL_S_LVS_AISLT_4 — 생성 중 로고 모션. */
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
  failureReason: "입력한 내용을 확인해 주세요.",
} satisfies CueSheetGenerationView;

/* FL_S_LVS_AIC_FAIL — 생성 요청이 거절돼 FE 안내를 실은 경우. `generation`을 주면 API 모드로
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
    docs: { description: { story: "생성 요청 실패를 FE 안내 문구로 싣는 실패 화면." } },
  },
};

/* 서버가 FAILED를 준 경우. BE 사유 원문은 싣지 않으므로 기본 문구로 대체된다(#403). */
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
