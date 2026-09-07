import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LiveConsole } from "./live-console";

const meta = {
  title: "Features/LiveConsole/Console",
  component: LiveConsole,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  render: (args) => <LiveConsole key={JSON.stringify(args)} {...args} />,
} satisfies Meta<typeof LiveConsole>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BeforeStart: Story = { args: { initialView: "ready" } };
export const Broadcasting: Story = { args: { initialView: "live" } };
export const AllQuestions: Story = { args: { initialView: "originals" } };
export const SuggestedAnswer: Story = { args: { initialView: "answer" } };
export const AnswerUnavailable: Story = { args: { initialView: "unavailable" } };
export const CueCollapsed: Story = { args: { initialView: "cue-collapsed" } };
export const BroadcastEnded: Story = { args: { initialView: "ended" } };
export const CheckSelection: Story = { args: { initialView: "check" } };
export const SentAnswer: Story = { args: { initialView: "check-detail" } };
