import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { BottomSheet } from "./bottom-sheet";
import { Button } from "./button";
import { Checkbox } from "./checkbox";

const meta = {
  title: "Shared/UI/BottomSheet",
  component: BottomSheet,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof BottomSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { "aria-label": "약관 동의", children: null, onClose: () => {}, open: false },
  render: function DefaultStory() {
    const [open, setOpen] = useState(false);

    return (
      <div className="min-h-dvh p-5">
        <Button onClick={() => setOpen(true)}>시트 열기</Button>
        {/* 시트에 보이는 제목이 없을 때는 aria-label로 이름을 준다. */}
        <BottomSheet aria-label="약관 동의" onClose={() => setOpen(false)} open={open}>
          <p className="text-body-emphasis text-text-default">펀딧 이용 약관 동의 (전체)</p>
          <p className="text-body-s text-text-secondary mt-3">
            ESC, backdrop 클릭, 닫기 버튼 어느 쪽으로도 닫힙니다.
          </p>
          <Button className="mt-6 w-full" onClick={() => setOpen(false)}>
            닫기
          </Button>
        </BottomSheet>
      </div>
    );
  },
};

const terms = [
  "서비스 이용약관 동의 (필수)",
  "개인정보 수집·이용 동의 (필수)",
  "만 14세 이상입니다 (필수)",
  "마케팅 정보 수신 동의 (선택)",
  "AI 개인화 서비스 활용 동의 (선택)",
];

/* 회원가입 약관 시트의 실제 배치 예다. 시트 안에서 Tab이 순환하는지 확인한다. */
export const TermsSheet: Story = {
  args: { "aria-labelledby": "terms-sheet-title", children: null, onClose: () => {}, open: false },
  render: function TermsSheetStory() {
    const [open, setOpen] = useState(true);

    return (
      <div className="min-h-dvh p-5">
        <Button onClick={() => setOpen(true)}>약관 시트 열기</Button>
        {/* 보이는 제목이 있으면 그 id를 aria-labelledby로 연결한다. */}
        <BottomSheet aria-labelledby="terms-sheet-title" onClose={() => setOpen(false)} open={open}>
          <div className="flex items-center justify-between">
            <h2 className="text-body-emphasis text-text-default sr-only" id="terms-sheet-title">
              약관 동의
            </h2>
            <Checkbox>펀딧 이용 약관 동의 (전체)</Checkbox>
            <button aria-label="닫기" onClick={() => setOpen(false)} type="button">
              <span className="text-body-m text-text-default">✕</span>
            </button>
          </div>
          <div className="mt-5 flex flex-col gap-4">
            {terms.map((term) => (
              <Checkbox key={term}>{term}</Checkbox>
            ))}
          </div>
          <Button className="mt-6 w-full" onClick={() => setOpen(false)}>
            회원가입 하기
          </Button>
        </BottomSheet>
      </div>
    );
  },
};
