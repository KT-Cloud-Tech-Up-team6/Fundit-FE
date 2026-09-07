import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Textarea } from "./textarea";

const meta = {
  title: "Shared/UI/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-135">
        <Story />
      </div>
    ),
  ],
  args: {
    "aria-label": "소개 문구",
    className: "h-40",
    placeholder: "소개 문구를 입력해주세요 (최대 300자)",
  },
  argTypes: {
    error: { control: "boolean" },
    maxLength: { control: "number" },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/* maxLength가 있을 때만 오른쪽 아래 카운터가 붙는다. */
export const WithCounter: Story = {
  args: { maxLength: 300 },
};

export const Filled: Story = {
  args: {
    defaultValue:
      "로보락 F25는 180도 완전히 평평하게 눕혀지는 플랫 디자인으로 가구 밑 좁은 틈새까지 빈틈없이 청소합니다. 20,000Pa의 강력한 흡입력과 고온 세척 및 열풍 건조 기능을 갖추어 먼지 흡입부터 물걸레 관리까지 완벽하게 해결합니다.",
    maxLength: 300,
  },
};

export const Error: Story = {
  args: { defaultValue: "소개 문구는 10자 이상 입력해야 합니다", error: true, maxLength: 300 },
};

export const Disabled: Story = {
  args: { defaultValue: "수정할 수 없는 상태입니다", disabled: true, maxLength: 300 },
};
