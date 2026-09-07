import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
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
