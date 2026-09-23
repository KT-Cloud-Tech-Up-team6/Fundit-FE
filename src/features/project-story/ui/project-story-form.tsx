"use client";

import type { Editor, JSONContent } from "@tiptap/core";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { uploadProjectMedia, validateProjectMedia } from "@/entities/project/api/media-api";
import { saveProjectStory } from "@/entities/project/api/story-api";
import type { StoryPreviewResponse } from "@/entities/project/api/story-api";
import { agreeProjectPrivacy, submitProject } from "@/entities/project/api/seller-project-api";
import { ProjectConsentModal } from "@/features/project-basic-info/ui/project-consent-modal";
import { isApiError } from "@/shared/api/api-error";
import { fromIntroContent, toIntroContent } from "../model/story-content";
import { missingPublishRequirements, type PublishRequirement } from "../model/project-publish";
import { ProjectPageHeader } from "@/entities/project/ui/project-sidebar";
import { Button } from "@/shared/components/ui/button";
import { FormField } from "@/shared/components/ui/form-field";
import { Input } from "@/shared/components/ui/input";
import { TextButton } from "@/shared/components/ui/text-button";
import { PublishConfirmModal, PublishMissingModal, PublishedModal } from "./project-publish-modal";
import { StoryEditor } from "./story-editor";
import { StoryPreview } from "./story-preview";
import { ThumbnailUpload } from "./thumbnail-upload";

const createBreadcrumb = ["내 프로젝트", "신규 생성하기", "기본 정보 등록", "스토리 작성"];
const editBreadcrumb = ["내 프로젝트", "스토리 작성"];

/* 준비중 프로젝트의 저장은 공개다(2026-09-23 결정). 확인 → 스토리 저장 → 공개 순서이며,
   개인정보 동의 기록이 없다는 422를 받으면 동의 모달을 거쳐 처음부터 다시 시도한다. */
type PublishStep =
  | { step: "confirm"; error?: string }
  | { step: "consent" }
  | { step: "missing"; items: PublishRequirement[]; message: string }
  | { step: "done" };

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
  const [publishStep, setPublishStep] = useState<PublishStep | null>(null);
  const draft = initial?.status === "DRAFT";
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
  async function saveStory(currentEditor: Editor) {
    if (title.length > 40) throw new Error("제목은 40자 이내로 입력해주세요.");
    const introContent = toIntroContent(currentEditor.getJSON());
    await saveProjectStory(projectId, {
      title,
      ...(thumbnailUrl ? { coverImageUrl: thumbnailUrl } : {}),
      introContent,
    });
  }
  async function save() {
    if (!editor || pending.current || !initial) return;
    pending.current = true;
    setBusy(true);
    setMessage("");
    setFailed(false);
    try {
      await saveStory(editor);
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
  async function publish(consented = false) {
    if (!editor || pending.current || !initial) return;
    pending.current = true;
    setBusy(true);
    setMessage("");
    setPublishStep({ step: "confirm" });
    try {
      if (consented) await agreeProjectPrivacy(projectId);
      await saveStory(editor);
      await submitProject(projectId);
      await Promise.all([
        cache.invalidateQueries({ queryKey: ["seller-project-preview"] }),
        cache.invalidateQueries({ queryKey: ["seller-projects"] }),
        cache.invalidateQueries({ queryKey: ["seller-project-counts"] }),
      ]);
      setPublishStep({ step: "done" });
    } catch (error) {
      if (isApiError(error) && error.code === "PROJECT_NOT_SUBMITTABLE") {
        const items = missingPublishRequirements(error.message);
        setPublishStep(
          items.includes("privacyConsent") && !consented
            ? { step: "consent" }
            : { step: "missing", items, message: error.message },
        );
      } else {
        setPublishStep({
          step: "confirm",
          error: error instanceof Error ? error.message : "프로젝트를 공개하지 못했습니다.",
        });
      }
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
    <>
      <fieldset disabled={busy} className="w-full min-w-0 lg:max-w-[792px]">
        <ProjectPageHeader
          breadcrumb={initial ? editBreadcrumb : createBreadcrumb}
          title="스토리 작성"
        />

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
                  setThumbnailUrl(
                    initial ? await upload(file, "image") : URL.createObjectURL(file),
                  );
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
           임시저장은 소개만 저장하고, 준비중 프로젝트의 저장은 공개 확인을 거쳐 공개한다.
           이미 공개된 프로젝트의 저장은 소개 저장이다(docs/API_CONTRACT.md). */}
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
              onClick={() => (draft ? setPublishStep({ step: "confirm" }) : void save())}
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
      {publishStep?.step === "confirm" && (
        <PublishConfirmModal
          busy={busy}
          error={publishStep.error}
          onCancel={() => setPublishStep(null)}
          onConfirm={() => void publish()}
        />
      )}
      {publishStep?.step === "consent" && (
        <ProjectConsentModal
          onAgree={() => void publish(true)}
          onClose={() => setPublishStep(null)}
        />
      )}
      {publishStep?.step === "missing" && (
        <PublishMissingModal
          items={publishStep.items}
          message={publishStep.message}
          projectId={projectId}
          onClose={() => setPublishStep(null)}
        />
      )}
      {publishStep?.step === "done" && (
        <PublishedModal projectId={projectId} onClose={() => setPublishStep(null)} />
      )}
    </>
  );
}
