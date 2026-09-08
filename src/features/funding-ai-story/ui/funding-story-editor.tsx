"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Modal } from "@/shared/components/ui/modal";
import { Textarea } from "@/shared/components/ui/textarea";
import { demoProjectTitle, initialStoryBody } from "../model/story-demo";
import { FundingStoryModal } from "./funding-story-modal";
import { StoryIcon } from "./story-icon";
import { StoryPreview } from "./story-preview";

const editorTools = [
  ["bold", "굵게"],
  ["italic", "기울임"],
  ["align-left", "왼쪽 정렬"],
  ["align-center", "가운데 정렬"],
  ["align-right", "오른쪽 정렬"],
  ["image", "이미지"],
  ["video", "영상"],
  ["quote", "인용"],
  ["palette", "색상"],
  ["layout-vertical", "세로 배치"],
  ["layout-horizontal", "가로 배치"],
] as const;

export function FundingStoryEditor({ projectId }: { projectId: string }) {
  const headingId = useId();
  const bodyId = useId();
  const [title, setTitle] = useState(demoProjectTitle);
  const [body, setBody] = useState(initialStoryBody);
  const [modal, setModal] = useState<"ai" | "preview" | null>(null);
  const [notice, setNotice] = useState("");
  const openerRef = useRef<HTMLElement | null>(null);
  const projectPath = `/seller/projects/${encodeURIComponent(projectId)}`;

  useEffect(() => {
    if (!modal) openerRef.current?.focus();
  }, [modal]);

  function openModal(next: "ai" | "preview", opener: HTMLElement) {
    openerRef.current = opener;
    setModal(next);
  }

  return (
    <div className="flex flex-col gap-6 pt-3 lg:flex-row">
      <aside className="border-border-default h-fit shrink-0 rounded-xs border p-2 lg:min-h-177.5 lg:w-45">
        <Link href="/seller/projects" className="text-body-m flex items-center gap-1 px-2 py-2">
          <StoryIcon name="back" className="size-3" />내 프로젝트로
        </Link>
        <p className="border-border-default text-body-strong mb-2 border-b px-2 pb-3 break-words">
          <span className="line-clamp-2">{title || "프로젝트 제목"}</span>
        </p>
        <nav aria-label="프로젝트 작성 메뉴" className="flex flex-wrap gap-2 lg:flex-col">
          <button
            type="button"
            disabled
            title="기본 정보 수정은 연동 예정입니다."
            className="text-body-m rounded-xs px-2 py-1 text-left"
          >
            기본 정보 수정
          </button>
          {[
            ["story", "스토리 작성"],
            ["rewards", "리워드"],
            ["refund-policy", "환불 정책"],
            ["news", "새 소식"],
          ].map(([tab, label]) => (
            <Link
              key={tab}
              href={`${projectPath}?tab=${tab}`}
              aria-current={tab === "story" ? "page" : undefined}
              className={`text-body-m rounded-xs px-2 py-1 ${tab === "story" ? "bg-layer-surface-disabled" : ""}`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <section aria-labelledby={headingId} className="min-w-0 flex-1 lg:max-w-198">
        <p className="text-caption-strong py-1">내 프로젝트 &gt; 기본 정보 등록 &gt; 스토리 작성</p>
        <h1 id={headingId} className="text-heading-l py-3">
          스토리 작성
        </h1>
        <p className="text-caption-s mb-3">
          목업 화면입니다. 입력·생성 결과는 현재 화면에서만 유지되며 새로고침 시 초기화됩니다.
        </p>
        <div className="mb-6 grid gap-6 sm:grid-cols-2">
          <label className="text-title-s space-y-2">
            <span>프로젝트 제목</span>
            <Input
              className="h-10! rounded-xs!"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <div className="space-y-2">
            <p className="text-title-s">썸네일 이미지</p>
            <div className="flex gap-3">
              <Input
                aria-label="썸네일 이미지"
                className="h-10! rounded-xs!"
                value="이미지 업로드 연동 예정"
                readOnly
              />
              <button
                type="button"
                disabled
                className="bg-layer-surface-disabled text-body-strong shrink-0 rounded-xs px-2"
              >
                찾아 보기
              </button>
            </div>
          </div>
        </div>
        <div className="border-border-default flex h-131 flex-col overflow-hidden rounded-xs border">
          <div className="border-border-default flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2">
            <label htmlFor={bodyId} className="text-title-s">
              프로젝트 소개
            </label>
            <button
              type="button"
              className="bg-layer-surface-disabled text-body-strong h-9 rounded-xs px-2"
              onClick={(event) => openModal("ai", event.currentTarget)}
            >
              AI로 펀딩 스토리 작성
            </button>
          </div>
          <div
            className="border-border-default flex flex-wrap gap-3 border-b px-4 py-2"
            aria-label="서식 도구 (연동 예정)"
          >
            {editorTools.map(([name, label]) => (
              <button
                key={name}
                type="button"
                disabled
                aria-label={`${label} (연동 예정)`}
                title={`${label} 기능은 연동 예정입니다.`}
                className="flex h-5 w-3.5 items-center justify-center opacity-50"
              >
                <StoryIcon name={name} className="h-5 w-3.5" />
              </button>
            ))}
          </div>
          <Textarea
            id={bodyId}
            className="min-h-0 flex-1 border-0! py-6!"
            value={body}
            onChange={(event) => {
              setBody(event.target.value);
              setNotice("");
            }}
          />
        </div>
        <p className="text-caption-s mt-2">
          일반 텍스트 편집을 지원합니다. 서식 도구와 이미지·영상 업로드는 연동 예정입니다.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 sm:gap-6">
          <button
            type="button"
            className="bg-layer-surface-disabled text-body-strong h-11.5 flex-1 rounded-xs sm:max-w-45"
            onClick={(event) => openModal("preview", event.currentTarget)}
          >
            미리보기
          </button>
          <button
            type="button"
            className="bg-layer-surface-disabled text-body-strong ml-auto h-11.5 flex-1 rounded-xs sm:max-w-45"
            onClick={() =>
              setNotice("목업 임시저장입니다. 현재 화면에서만 유지되며 서버에는 저장되지 않습니다.")
            }
          >
            임시저장
          </button>
          <Button
            className="text-body-strong! flex-1 font-semibold! sm:max-w-45"
            onClick={() =>
              setNotice("목업 저장입니다. 실제 프로젝트에 저장하거나 게시하지 않습니다.")
            }
          >
            저장
          </Button>
        </div>
        <p role="status" className="text-body-s mt-3 min-h-6">
          {notice}
        </p>
      </section>
      {modal === "ai" && (
        <FundingStoryModal
          projectTitle={title || "프로젝트"}
          onClose={() => setModal(null)}
          onImport={(nextBody) => {
            setBody(nextBody);
            setModal(null);
            setNotice("AI 목업 결과를 프로젝트 소개에 불러왔습니다. 서버에는 저장되지 않았습니다.");
          }}
        />
      )}
      {modal === "preview" && (
        <Modal open title="스토리 미리보기" className="h-168 w-249!" onClose={() => setModal(null)}>
          <div className="mx-auto max-w-203 pt-6">
            <StoryPreview body={body} />
          </div>
        </Modal>
      )}
    </div>
  );
}
