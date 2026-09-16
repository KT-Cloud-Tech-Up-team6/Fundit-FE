import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EmptyState } from "./empty-state";
const meta = {
  title: "Shared/UI/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-[390px] max-w-full py-5">
        <Story />
      </div>
    ),
  ],
  args: {
    title: "검색 결과",
    subtitle: "다른 검색어를 입력해 보세요.",
    message: "검색 결과가 없습니다.",
    description: "검색어의 철자와 띄어쓰기를 확인해 주세요.",
  },
} satisfies Meta<typeof EmptyState>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const WithGraphic: Story = {
  args: { graphic: <div aria-hidden className="bg-layer-surface-disabled size-28 rounded-full" /> },
};
export const MessageOnly: Story = {
  args: { title: undefined, subtitle: undefined, description: undefined },
};
export const LongContent: Story = {
  args: {
    title: "입력하신 검색어에 해당하는 프로젝트를 찾을 수 없습니다.",
    message: "현재 검색 조건에 맞는 프로젝트가 없습니다. 검색어를 변경해 주세요.",
    description: "다른 검색어를 입력하거나 조건을 변경하면 더 많은 프로젝트를 찾아볼 수 있습니다.",
  },
};
