"use client";

import type { Editor, JSONContent } from "@tiptap/core";
import { useEffect, useState } from "react";
import { Breadcrumb } from "@/shared/components/ui/breadcrumb";
import { Button } from "@/shared/components/ui/button";
import { FormField } from "@/shared/components/ui/form-field";
import { Input } from "@/shared/components/ui/input";
import { TextButton } from "@/shared/components/ui/text-button";
import { StoryEditor } from "./story-editor";
import { StoryPreview } from "./story-preview";
import { ThumbnailUpload } from "./thumbnail-upload";

const breadcrumb = ["내 프로젝트", "신규 생성하기", "기본 정보 등록", "스토리 작성"];

export function ProjectStoryForm({ projectId }: { projectId: string }) {
  const [title, setTitle] = useState("");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [previewContent, setPreviewContent] = useState<JSONContent | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl);
    };
  }, [thumbnailUrl]);

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
          className="min-w-0 [&_label]:leading-[26px] [&_label]:font-medium"
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
          />
        </FormField>

        <FormField
          htmlFor="story-thumbnail-name"
          label="썸네일 이미지"
          className="min-w-0 [&_label]:leading-[26px] [&_label]:font-medium"
        >
          <ThumbnailUpload onFileChange={(file) => setThumbnailUrl(URL.createObjectURL(file))} />
        </FormField>
      </div>

      <StoryEditor projectTitle={title} onReady={setEditor} />

      <div className="mt-16 flex flex-wrap items-center justify-between gap-3 pb-1.5">
        <Button
          variant="secondary"
          size="lg"
          appearance="cta"
          disabled={!editor}
          onClick={() => editor && setPreviewContent(editor.getJSON())}
          className="w-[186px]"
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
      {previewContent && (
        <StoryPreview
          content={previewContent}
          projectId={projectId}
          title={title}
          thumbnailUrl={thumbnailUrl}
          onClose={() => setPreviewContent(null)}
        />
      )}
    </div>
  );
}
