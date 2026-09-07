import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { createDemoScenes, demoAnswers } from "../model/cue-sheet-demo";
import { LiveCueSheetFlow } from "./live-cue-sheet-flow";

const meta = {
  title: "Features/LiveCueSheet/Flow",
  component: LiveCueSheetFlow,
  parameters: { layout: "fullscreen" },
  render: (args) => <LiveCueSheetFlow key={JSON.stringify(args)} {...args} />,
} satisfies Meta<typeof LiveCueSheetFlow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Chat: Story = {};
export const Studio: Story = { args: { initialStep: "studio" } };
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

export const Saved: Story = {
  args: {
    initialStep: "create",
    initialAnswers: demoAnswers,
    initialSavedCueSheet: {
      scenes: createDemoScenes(10, demoAnswers),
      type: "script",
      minutes: 10,
    },
  },
};
