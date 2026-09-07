import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { Button } from "./button";
import { Modal } from "./modal";
import { Textarea } from "./textarea";

const meta = {
  title: "Shared/UI/Modal",
  component: Modal,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseArgs = {
  children: null,
  onClose: () => {},
  open: false,
  title: "LIVE 생성하기",
};

export const Default: Story = {
  args: baseArgs,
  render: function DefaultStory() {
    const [open, setOpen] = useState(false);

    return (
      <div className="min-h-dvh p-5">
        <Button onClick={() => setOpen(true)}>모달 열기</Button>
        <Modal onClose={() => setOpen(false)} open={open} title="LIVE 생성하기">
          <p className="text-body-m text-text-default mt-6">
            ESC, backdrop 클릭, 닫기 버튼 어느 쪽으로도 닫힙니다. Tab은 모달 안에서 순환합니다.
          </p>
        </Modal>
      </div>
    );
  },
};

/* FL_S_LV_CREATE_4(라이브 생성 확인)의 실제 배치다. 높이 고정과 하단 CTA는 호출자가 갖는다. */
export const CreateLiveConfirm: Story = {
  args: baseArgs,
  render: function CreateLiveConfirmStory() {
    const [open, setOpen] = useState(true);

    return (
      <div className="min-h-dvh p-5">
        <Button onClick={() => setOpen(true)}>모달 열기</Button>
        <Modal className="h-168" onClose={() => setOpen(false)} open={open} title="LIVE 생성하기">
          <div className="flex h-full flex-col">
            <p className="text-title-s text-text-default mt-6 text-center font-medium">
              입력된 내용이 맞는지 확인해주세요
            </p>
            <Textarea
              className="mt-11 h-40"
              defaultValue="로보락 F25는 180도 완전히 평평하게 눕혀지는 플랫 디자인으로 가구 밑 좁은 틈새까지 빈틈없이 청소합니다."
              maxLength={300}
              readOnly
              aria-label="소개 문구"
            />
            {/* ponytail: Figma의 보조 CTA(회색 배경 + 검정 글자)는 Button variant에 없다.
                생성 모달을 붙일 때 secondary variant를 확정하고 두 개 다 Button으로 만든다. */}
            <div className="mt-auto pt-6">
              <Button className="h-10 w-full" size="md" onClick={() => setOpen(false)}>
                라이브 시작
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  },
};

export const LongContent: Story = {
  args: baseArgs,
  render: function LongContentStory() {
    const [open, setOpen] = useState(true);

    return (
      <div className="min-h-dvh p-5">
        <Button onClick={() => setOpen(true)}>모달 열기</Button>
        <Modal className="h-168" onClose={() => setOpen(false)} open={open} title="프로젝트 선택">
          <ul className="mt-6 flex flex-col gap-2">
            {Array.from({ length: 20 }, (_, index) => (
              <li
                key={index}
                className="border-w-xs border-border-default text-body-m text-text-default rounded-xs p-4"
              >
                프로젝트 {index + 1}
              </li>
            ))}
          </ul>
        </Modal>
      </div>
    );
  },
};
