"use client";

import { useState } from "react";
import { Button, secondaryButtonClasses } from "@/shared/components/ui/button";
import { StoryEditor } from "./story-editor";
import { ThumbnailUpload } from "./thumbnail-upload";

const breadcrumb = ["내 프로젝트", "신규 생성하기", "기본 정보 등록", "스토리 작성"];

export function ProjectStoryForm() {
  const [title, setTitle] = useState("");

  return (
    <div className="min-w-0 flex-1">
      <nav aria-label="이동 경로" className="text-label-m text-text-secondary">
        <ol className="flex items-center gap-2">
          {breadcrumb.map((crumb, index) => {
            const isCurrent = index === breadcrumb.length - 1;
            return (
              <li key={crumb} className="flex items-center gap-2">
                {index > 0 && <span aria-hidden>{">"}</span>}
                <span
                  aria-current={isCurrent ? "page" : undefined}
                  className={isCurrent ? "text-text-default" : undefined}
                >
                  {crumb}
                </span>
              </li>
            );
          })}
        </ol>
      </nav>

      <h1 className="text-heading-l mt-3">스토리 작성</h1>

      <div className="mt-5 flex flex-col gap-6 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="project-title" className="text-title-s">
            프로젝트 제목
          </label>
          <input
            id="project-title"
            placeholder="프로젝트 제목을 입력해주세요"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="text-body-s placeholder:text-text-disabled bg-layer-surface-disabled mt-2 h-10 w-full rounded-xs px-4 outline-none"
          />
        </div>

        <div className="flex-1">
          <span className="text-title-s">썸네일 이미지</span>
          <ThumbnailUpload />
        </div>
      </div>

      <StoryEditor projectTitle={title} />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        {/* ponytail: 6팀_IA_v1.2.xlsx 판매자 IA #36은 미리보기를 "(후순위)"로 표시하고
           FL_S_PR_PREV를 모달로 정의한다. docs/ROUTING.md엔 이미 /seller/projects/[projectId]/preview
           페이지 라우트가 있어 모달 vs 페이지가 어긋난다 — 임의로 고르지 않고 비활성으로 둔다.
           우선순위·라우팅이 정해지면 그때 하나로 정리한다. Figma는 비활성 상태를 표현하지 않고
           항상 활성 색으로 그려서, disabled 대신 aria-disabled로 눌리지 않게만 막고 색은 그대로 둔다. */}
        <button
          type="button"
          aria-disabled="true"
          className={`${secondaryButtonClasses} text-body-strong! h-[46px] w-45 cursor-not-allowed font-semibold!`}
        >
          미리보기
        </button>
        {/* ponytail: 임시저장·저장은 저장 API가 없어 disabled로 막는다. 입력값은 title
           state·Tiptap 에디터·ThumbnailUpload에 남아있지만 서버로 보낼 수단이 없다.
           API가 생기면 실제 저장 동작을 연결한다. */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled
            className={`${secondaryButtonClasses} text-body-strong! h-[46px] w-45 font-semibold!`}
          >
            임시저장
          </button>
          <Button disabled size="lg" appearance="cta" className="w-45">
            저장
          </Button>
        </div>
      </div>
    </div>
  );
}
