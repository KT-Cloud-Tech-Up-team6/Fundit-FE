import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
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

export const SelectionResetAfterPublish: Story = {
  args: { initialView: "check" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dialog = within(await canvas.findByRole("dialog"));
    await userEvent.click(dialog.getAllByRole("checkbox")[0]);
    await userEvent.click(dialog.getByRole("button", { name: "LIVE 체크 생성(1)" }));
    await expect(canvas.getByRole("status")).toHaveTextContent(
      "목업 LIVE 체크 1건을 생성했습니다.",
    );
    await userEvent.click(canvas.getByRole("button", { name: /^LIVE 체크$/ }));
    const reopened = within(await canvas.findByRole("dialog"));
    for (const checkbox of reopened.getAllByRole("checkbox")) {
      await expect(checkbox).not.toBeChecked();
    }
    await expect(reopened.getByRole("button", { name: "LIVE 체크 생성(0)" })).toBeDisabled();
  },
};

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
