"use client";

import Link from "next/link";
import { Button } from "@/shared/components/ui/button";
import { Modal } from "@/shared/components/ui/modal";
import { publishRequirements, type PublishRequirement } from "../model/project-publish";

/* Figma에 공개 확인 화면이 없어(2026-09-23 결정) 같은 생성 흐름의 저장 완료 모달
   (FL_S_PR_CREATE_22, 모달 인스턴스 1958:44361)이 쓰는 modal_web `modal_s` 규격을 따른다.
   제목·본문·버튼 사이 64px, 본문 Body 16, 버튼 높이 40·간격 12. */

const actions = "mt-16 flex gap-3";
const cta = { appearance: "cta", size: "md", className: "flex-1" } as const;

export function PublishConfirmModal({
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  busy: boolean;
  error?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal open title="프로젝트를 공개할까요?" onClose={() => !busy && onCancel()}>
      <p className="text-body-m mt-16 text-center break-keep">
        공개하면 바로 펀딩이 시작되어 30일 동안 진행됩니다.
        <br />
        공개한 뒤에는 준비중으로 되돌릴 수 없습니다.
      </p>
      {error && (
        <p role="alert" className="text-body-s text-text-error mt-3 text-center break-keep">
          {error}
        </p>
      )}
      <div className={actions}>
        <Button type="button" variant="secondary" {...cta} disabled={busy} onClick={onCancel}>
          취소
        </Button>
        <Button type="button" {...cta} disabled={busy} onClick={onConfirm}>
          {busy ? "공개하는 중" : "공개하기"}
        </Button>
      </div>
    </Modal>
  );
}

export function PublishMissingModal({
  items,
  message,
  projectId,
  onClose,
}: {
  items: PublishRequirement[];
  /** 빠진 항목을 읽지 못했을 때 대신 보여 줄 서버 메시지. */
  message: string;
  projectId: string;
  onClose: () => void;
}) {
  return (
    <Modal open title="필수 항목을 완료해주세요" onClose={onClose}>
      <p className="text-body-m mt-16 text-center break-keep">
        {items.length ? "아래 항목을 완료하면 공개할 수 있습니다." : message}
      </p>
      {items.length > 0 && (
        <ul className="border-border-default divide-border-default mt-6 divide-y rounded-xs border">
          {items.map((item) => {
            const requirement = publishRequirements[item];
            return (
              <li key={item} className="flex min-h-12 items-center justify-between gap-3 px-4">
                <span className="text-body-m text-text-default">{requirement.label}</span>
                {"tab" in requirement ? (
                  <Link
                    href={`/seller/projects/${encodeURIComponent(projectId)}?tab=${requirement.tab}`}
                    className="text-caption-s text-text-secondary focus-visible:outline-border-primary font-medium underline focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    작성하러 가기
                  </Link>
                ) : (
                  <span className="text-caption-s text-text-secondary">{requirement.hint}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <div className={actions}>
        <Button type="button" {...cta} onClick={onClose}>
          확인
        </Button>
      </div>
    </Modal>
  );
}

export function PublishedModal({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  return (
    <Modal open title="프로젝트가 공개되었습니다" onClose={onClose}>
      <p className="text-body-m mt-16 text-center break-keep">
        지금부터 30일 동안 펀딩이 진행됩니다.
      </p>
      <div className={actions}>
        <Button href="/seller/projects?status=active" variant="secondary" {...cta}>
          내 프로젝트
        </Button>
        <Button href={`/projects/${encodeURIComponent(projectId)}`} {...cta}>
          상세페이지 보기
        </Button>
      </div>
    </Modal>
  );
}
