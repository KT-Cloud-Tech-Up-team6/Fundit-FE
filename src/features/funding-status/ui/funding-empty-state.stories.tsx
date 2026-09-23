import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { FundingEmptyState } from "./funding-empty-state";

const meta = {
  title: "Features/Funding Status/Empty",
  component: FundingEmptyState,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="bg-layer-surface-default p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FundingEmptyState>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Draft: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText("펀딩 내역이 없습니다")).toBeVisible();
    expect(canvas.queryByRole("button")).toBeNull();
  },
};
