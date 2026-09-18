"use client";

import { useState } from "react";
import { Breadcrumb } from "@/shared/components/ui/breadcrumb";
import { Button } from "@/shared/components/ui/button";
import { FormField } from "@/shared/components/ui/form-field";
import { Input } from "@/shared/components/ui/input";
import { TextButton } from "@/shared/components/ui/text-button";
import { StoryEditor } from "./story-editor";
import { ThumbnailUpload } from "./thumbnail-upload";

const breadcrumb = ["내 프로젝트", "신규 생성하기", "기본 정보 등록", "스토리 작성"];

export function ProjectStoryForm() {
  const [title, setTitle] = useState("");

  return (
    <div className="w-full min-w-0 lg:max-w-[792px]">
      <header className="flex h-20 flex-col justify-center gap-4">
        <Breadcrumb items={breadcrumb} />
        <h1 className="text-heading-l">스토리 작성</h1>
      </header>

      <div className="mt-3 grid gap-6 sm:grid-cols-2">
        <FormField
          htmlFor="project-title"
          label="프로젝트 제목"
          className="min-w-0 [&_label]:leading-[26px] [&_label]:font-bold"
          action={
            <TextButton
              showIcon={false}
              disabled
              title="제목 수정 방식이 확정되면 제공됩니다."
              className="disabled:text-text-disabled cursor-not-allowed font-bold"
            >
              수정
            </TextButton>
          }
        >
          <Input
            id="project-title"
            shape="compact"
            placeholder="프로젝트 제목을 입력해주세요"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="[&_input]:font-semibold"
          />
        </FormField>

        <FormField
          htmlFor="story-thumbnail-name"
          label="썸네일 이미지"
          className="min-w-0 [&_label]:leading-[26px] [&_label]:font-bold"
        >
          <ThumbnailUpload />
        </FormField>
      </div>

      <StoryEditor projectTitle={title} />

      <div className="mt-16 flex flex-wrap items-center justify-between gap-3 pb-1.5">
        {/* 판매자 IA PDF 4페이지는 FL_S_PR_PREV를 후순위 모달로 정의한다.
           구매자 상세 형태로 보여주고 닫으면 작성 화면으로 돌아온다. 이번 디자인 반영 범위에서는
           비활성을 유지한다. 기존 /preview 페이지 라우트와의 통합은 후속 구현에서 정리한다.
           Figma는 비활성 상태를 표현하지 않고
           항상 활성 색으로 그려서, disabled 대신 aria-disabled로 눌리지 않게만 막고 색은 그대로 둔다. */}
        <Button
          variant="secondary"
          size="lg"
          appearance="cta"
          aria-disabled="true"
          tabIndex={-1}
          title="미리보기는 준비 중입니다."
          className="w-[186px] cursor-not-allowed"
        >
          미리보기
        </Button>
        {/* 소개 저장 API 명세는 docs/API_CONTRACT.md에 있다. 편집기 콘텐츠 변환·업로드·저장
           연동은 미구현이므로 임시저장·저장은 비활성으로 유지한다. */}
        <div className="grid w-full grid-cols-2 gap-3 sm:w-96">
          <Button
            variant="secondary"
            size="lg"
            appearance="cta"
            disabled
            title="저장 기능은 준비 중입니다."
          >
            임시저장
          </Button>
          <Button disabled size="lg" appearance="cta" title="저장 기능은 준비 중입니다.">
            저장
          </Button>
        </div>
      </div>
    </div>
  );
}
