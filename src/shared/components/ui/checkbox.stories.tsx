import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { Checkbox } from "./checkbox";

const meta = {
  title: "Shared/UI/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: {
    children: "서비스 이용약관 동의 (필수)",
    disabled: false,
    indeterminate: false,
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Checked: Story = {
  args: { defaultChecked: true },
};

export const Indeterminate: Story = {
  args: { indeterminate: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const DisabledChecked: Story = {
  args: { defaultChecked: true, disabled: true },
};

export const Gallery: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Checkbox {...args}>기본</Checkbox>
      <Checkbox {...args} defaultChecked>
        선택됨
      </Checkbox>
      <Checkbox {...args} indeterminate>
        부분 선택
      </Checkbox>
      <Checkbox {...args} disabled>
        비활성
      </Checkbox>
      <Checkbox {...args} defaultChecked disabled>
        비활성 + 선택됨
      </Checkbox>
    </div>
  ),
};

const terms = [
  { label: "서비스 이용약관 동의 (필수)", required: true },
  { label: "개인정보 수집·이용 동의 (필수)", required: true },
  { label: "만 14세 이상입니다 (필수)", required: true },
  { label: "마케팅 정보 수신 동의 (선택)", required: false },
  { label: "AI 개인화 서비스 활용 동의 (선택)", required: false },
];

/* 전체 동의가 하위 항목을 일괄 토글하고, 일부만 선택되면 indeterminate가 되는 실제 사용 예다. */
export const TermsGroup: Story = {
  render: function TermsGroupStory() {
    const [checked, setChecked] = useState<boolean[]>(() => terms.map(() => false));
    const allChecked = checked.every(Boolean);
    const someChecked = checked.some(Boolean);

    return (
      <div className="flex w-[350px] flex-col gap-3">
        <Checkbox
          checked={allChecked}
          indeterminate={someChecked && !allChecked}
          onChange={(event) => setChecked(terms.map(() => event.target.checked))}
        >
          펀딧 이용 약관 동의 (전체)
        </Checkbox>
        <hr className="border-border-default" />
        {terms.map((term, index) => (
          <Checkbox
            checked={checked[index]}
            key={term.label}
            onChange={(event) =>
              setChecked((previous) =>
                previous.map((value, target) => (target === index ? event.target.checked : value)),
              )
            }
          >
            {term.label}
          </Checkbox>
        ))}
      </div>
    );
  },
};
