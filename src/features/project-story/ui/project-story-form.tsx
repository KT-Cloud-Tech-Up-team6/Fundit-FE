"use client";

import type { Editor, JSONContent } from "@tiptap/core";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { uploadProjectMedia, validateProjectMedia } from "@/entities/project/api/media-api";
import { saveProjectStory } from "@/entities/project/api/story-api";
import type { StoryPreviewResponse } from "@/entities/project/api/story-api";
import { fromIntroContent, toIntroContent } from "../model/story-content";
import { Breadcrumb } from "@/shared/components/ui/breadcrumb";
import { Button } from "@/shared/components/ui/button";
import { FormField } from "@/shared/components/ui/form-field";
import { Input } from "@/shared/components/ui/input";
import { TextButton } from "@/shared/components/ui/text-button";
import { StoryEditor } from "./story-editor";
import { StoryPreview } from "./story-preview";
import { ThumbnailUpload } from "./thumbnail-upload";

const breadcrumb = ["내 프로젝트", "신규 생성하기", "기본 정보 등록", "스토리 작성"];

export function ProjectStoryForm({
  projectId,
  initial,
}: {
  projectId: string;
  initial?: StoryPreviewResponse;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const cache = useQueryClient();
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [previewContent, setPreviewContent] = useState<JSONContent | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(initial?.coverImageUrl ?? null);
  useEffect(() => {
    editor?.setEditable(!busy);
  }, [editor, busy]);
  const [initialContent] = useState(() =>
    initial ? fromIntroContent(initial.introContent ?? []) : undefined,
  );
  async function upload(file: File, kind: "image" | "video") {
    if (pending.current) throw new Error("업로드 또는 저장 중입니다.");
    pending.current = true;
    setBusy(true);
    setMessage("");
    try {
      return await uploadProjectMedia(projectId, file, kind);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  async function save() {
    if (!editor || pending.current || !initial) return;
    pending.current = true;
    setBusy(true);
    setMessage("");
    setFailed(false);
    try {
      if (title.length > 40) throw new Error("제목은 40자 이내로 입력해주세요.");
      const introContent = toIntroContent(editor.getJSON());
      await saveProjectStory(projectId, {
        title,
        ...(thumbnailUrl ? { coverImageUrl: thumbnailUrl } : {}),
        introContent,
      });
      await cache.invalidateQueries({ queryKey: ["seller-project-preview"] });
      await cache.invalidateQueries({ queryKey: ["seller-projects"] });
      setMessage("스토리를 저장했습니다.");
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : "스토리를 저장하지 못했습니다.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  useEffect(() => {
    return () => {
      if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl);
    };
  }, [thumbnailUrl]);

  return (
    <fieldset disabled={busy} className="w-full min-w-0 lg:max-w-[792px]">
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
            maxLength={initial ? 40 : undefined}
            onChange={(event) => setTitle(event.target.value)}
          />
        </FormField>

        <FormField
          htmlFor="story-thumbnail-name"
          label="썸네일 이미지"
          className="min-w-0 [&_label]:leading-[26px] [&_label]:font-medium"
        >
          <ThumbnailUpload
            initialName={initial?.coverImageUrl ?? ""}
            onFileChange={async (file) => {
              setFailed(false);
              try {
                validateProjectMedia(file, "image");
                setThumbnailUrl(initial ? await upload(file, "image") : URL.createObjectURL(file));
              } catch (error) {
                setFailed(true);
                setMessage(
                  error instanceof Error ? error.message : "이미지를 업로드하지 못했습니다.",
                );
              }
            }}
          />
        </FormField>
      </div>

      <StoryEditor
        projectTitle={title}
        onReady={setEditor}
        initialContent={initialContent}
        upload={initial ? upload : undefined}
        projectId={initial ? projectId : undefined}
        onAiCoverImport={setThumbnailUrl}
      />

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
        {/* 서버에서 불러온 프로젝트만 저장하며, 데모에서는 미리보기만 제공한다.
           임시저장과 저장은 같은 소개 저장 API를 사용한다(docs/API_CONTRACT.md). */}
        <div className="grid w-full grid-cols-2 gap-3 sm:w-96">
          <Button
            variant="secondary"
            size="lg"
            appearance="cta"
            disabled={!initial || !editor || busy}
            onClick={() => void save()}
          >
            임시저장
          </Button>
          <Button
            disabled={!initial || !editor || busy}
            size="lg"
            appearance="cta"
            onClick={() => void save()}
          >
            저장
          </Button>
        </div>
      </div>
      {message && <p role={failed ? "alert" : "status"}>{message}</p>}
      {previewContent && (
        <StoryPreview
          content={previewContent}
          projectId={projectId}
          title={title}
          thumbnailUrl={thumbnailUrl}
          onClose={() => setPreviewContent(null)}
        />
      )}
    </fieldset>
  );
}
