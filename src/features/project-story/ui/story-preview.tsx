"use client";

import type { JSONContent } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import { projectDemo } from "@/features/buyer-project/model/project-demo";
import { BuyerProjectDetail } from "@/features/buyer-project/ui/buyer-project-detail";
import detailStyles from "@/features/buyer-project/ui/buyer-project-detail.module.css";
import { Button } from "@/shared/components/ui/button";
import { Modal } from "@/shared/components/ui/modal";
import { storyExtensions } from "../model/story-extensions";
import styles from "./story-editor.module.css";

export function StoryPreview({
  content,
  projectId,
  title,
  thumbnailUrl,
  onClose,
}: {
  content: JSONContent;
  projectId: string;
  title: string;
  thumbnailUrl: string | null;
  onClose: () => void;
}) {
  const editor = useEditor({
    extensions: storyExtensions,
    content,
    editable: false,
    immediatelyRender: false,
    editorProps: { attributes: { "aria-label": "프로젝트 소개 미리보기", tabindex: "-1" } },
  });

  return (
    <Modal
      open
      onClose={onClose}
      size="l"
      title="미리보기"
      className="h-[672px] sm:mt-[clamp(20px,calc((100dvh-672px)/2),114px)] [&>div]:gap-6"
    >
      <div className="bg-layer-surface-disabled mx-auto min-h-full w-full max-w-[812px]">
        <p className="text-caption-s text-text-secondary mx-auto max-w-[390px] px-5 py-3">
          제목·썸네일·상품 소개는 현재 작성 내용이며, 나머지 정보는 예시입니다.
        </p>
        <BuyerProjectDetail
          projectId={projectId}
          activeTab="story"
          hasLive={false}
          preview
          project={{ ...projectDemo, title: title || "프로젝트 제목", image: thumbnailUrl ?? "" }}
          fundingAction={
            <Button disabled className={detailStyles.funding}>
              펀딩하기
            </Button>
          }
          storyContent={
            editor?.isEmpty ? (
              <p className="text-body-s text-text-secondary">작성한 프로젝트 소개가 없습니다.</p>
            ) : (
              <EditorContent
                editor={editor}
                className={`${styles.editor} text-body-s [&_blockquote]:border-border-default [&_blockquote]:text-text-secondary leading-[1.42] [&_.tiptap]:outline-none [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_iframe]:max-w-full [&_img]:max-w-full [&_img]:rounded-xs [&_video]:max-w-full [&_video]:rounded-xs`}
              />
            )
          }
        />
      </div>
    </Modal>
  );
}
