"use client";

import { Button } from "@/shared/components/ui/button";
import { Modal } from "@/shared/components/ui/modal";

/** Figma FL_S_PR_CREATE_22(node 1240:26544). 신규 프로젝트 첫 저장 직후에만 띄운다. */
export function ProjectSavedModal({
  onLater,
  onWriteStory,
}: {
  onLater: () => void;
  onWriteStory: () => void;
}) {
  return (
    <Modal open title="기본정보가 저장되었습니다" onClose={onLater}>
      <p className="text-body-m mt-6 text-center">이어서 펀딩 스토리를 작성하시겠어요?</p>
      <div className="mt-6 flex gap-3">
        <Button
          type="button"
          variant="secondary"
          appearance="cta"
          size="md"
          className="flex-1"
          onClick={onLater}
        >
          다음에
        </Button>
        <Button type="button" appearance="cta" size="md" className="flex-1" onClick={onWriteStory}>
          펀딩 스토리 작성
        </Button>
      </div>
    </Modal>
  );
}
