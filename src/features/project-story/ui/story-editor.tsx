"use client";

import { mergeAttributes, Node } from "@tiptap/core";
import { Placeholder } from "@tiptap/extensions";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import Youtube from "@tiptap/extension-youtube";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useRef, useState } from "react";
import { FundingStoryModal } from "@/features/funding-ai-story/ui/funding-story-modal";
import { secondaryButtonClasses } from "@/shared/components/ui/button";
import { Icon, type IconName } from "@/shared/components/ui/icon";

/* ponytail: #38(펀딩 AI 스토리 챗봇) 목업 결과는 일반 텍스트라 문단(\n\n)·줄바꿈(\n)만 있다.
   Tiptap에 그대로 setContent하면 개행이 사라져서 <p>/<br>로 변환해 붙인다. */
const escapeHtml = (text: string) =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const storyBodyToHtml = (body: string) =>
  body
    .split("\n\n")
    .map((paragraph) => `<p>${paragraph.split("\n").map(escapeHtml).join("<br>")}</p>`)
    .join("");

/* ponytail: mp4 등 직접 영상 파일 URL을 위한 공식 Tiptap 확장이 없어 최소 커스텀 노드로
   직접 만든다. 업로드가 아니라 이미 어딘가에 호스팅된 URL을 받아 <video>로 재생만 한다. */
const Video = Node.create({
  name: "video",
  group: "block",
  atom: true,
  addAttributes() {
    return { src: { default: null } };
  },
  parseHTML() {
    return [{ tag: "video[src]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["video", mergeAttributes(HTMLAttributes, { controls: "" })];
  },
});

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
]);

const isYoutubeUrl = (url: string) => {
  try {
    return YOUTUBE_HOSTS.has(new URL(url).hostname);
  } catch {
    return false;
  }
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 20 * 1024 * 1024;

/* ponytail: base64 임베드는 원본 파일 전체를 에디터 상태·DOM에 그대로 올린다. 상한 없이
   큰 파일을 받으면 탭이 멈추거나 죽을 수 있어 최소한의 크기 상한을 둔다. 실제 업로드 API가
   생기면 이 상한은 서버 쪽 제한으로 옮긴다. */
const readFileAsDataUrl = (file: File, onLoaded: (dataUrl: string) => void) => {
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === "string") onLoaded(reader.result);
  };
  reader.onerror = () => window.alert("파일을 읽는 중 문제가 발생했습니다.");
  reader.readAsDataURL(file);
};

const extensions = [
  StarterKit,
  TextAlign.configure({ types: ["paragraph"] }),
  TextStyle,
  Color,
  Image.configure({ inline: true, allowBase64: true }),
  Youtube.configure({ nocookie: true }),
  Video,
  Placeholder.configure({ placeholder: "프로젝트를 소개하는 내용을 자유롭게 작성해주세요." }),
];

type FormatButton = {
  icon: IconName;
  label: string;
  isActive: (editor: Editor) => boolean;
  onClick: (editor: Editor) => void;
};

const formatButtons: FormatButton[] = [
  {
    icon: "bold",
    label: "굵게",
    isActive: (editor) => editor.isActive("bold"),
    onClick: (editor) => editor.chain().focus().toggleBold().run(),
  },
  {
    icon: "italic",
    label: "기울임",
    isActive: (editor) => editor.isActive("italic"),
    onClick: (editor) => editor.chain().focus().toggleItalic().run(),
  },
  {
    icon: "alignLeft",
    label: "왼쪽 정렬",
    isActive: (editor) => editor.isActive({ textAlign: "left" }),
    onClick: (editor) => editor.chain().focus().setTextAlign("left").run(),
  },
  {
    icon: "alignCenter",
    label: "가운데 정렬",
    isActive: (editor) => editor.isActive({ textAlign: "center" }),
    onClick: (editor) => editor.chain().focus().setTextAlign("center").run(),
  },
  {
    icon: "alignRight",
    label: "오른쪽 정렬",
    isActive: (editor) => editor.isActive({ textAlign: "right" }),
    onClick: (editor) => editor.chain().focus().setTextAlign("right").run(),
  },
  {
    icon: "insertQuote",
    label: "인용구 삽입",
    isActive: (editor) => editor.isActive("blockquote"),
    onClick: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
];

const toolbarButtonClasses = (active: boolean) =>
  [
    "flex size-7 items-center justify-center rounded-xs",
    "focus-visible:outline-border-primary focus-visible:outline-2 focus-visible:outline-offset-2",
    active
      ? "bg-layer-surface-primary text-text-inverse"
      : "text-text-secondary hover:bg-layer-surface-disabled",
  ].join(" ");

/* ponytail: AI로 펀딩 스토리 작성은 #38에서 구현된 FundingStoryModal(목업 챗봇 대화 → 생성 →
   결과 불러오기)을 그대로 재사용한다. 실제 AI·API 계약은 여전히 미정(docs/OPEN_DECISIONS.md
   P1 "AI Story·Copilot")이라 모달 내부는 전부 목업이고, 결과를 "불러오기"하면 이 에디터의
   콘텐츠를 통째로 덮어쓴다(IA의 "전체 덮어쓰기"에 해당, "복사하기"는 모달에 없어 미구현).

   이미지 삽입은 업로드 서버가 없어 base64로 에디터 콘텐츠에 직접 임베드한다 — 데모/작성
   단계에서만 쓸 수 있고, 실제 저장 시엔 콘텐츠 용량이 커진다. 업로드 API가 생기면 base64
   대신 그 API로 올리고 URL만 저장하도록 바꾼다.

   동영상은 이미지처럼 파일을 직접 올릴 수도, YouTube·mp4 URL을 붙여넣을 수도 있다. 파일은
   이미지와 같은 방식(base64 임베드)이라 영상이라 용량이 훨씬 커진다 — 업로드 API가 생기면
   base64 대신 그 API로 올리고 URL만 저장하도록 바꾼다.

   URL이냐 파일이냐를 물어보는 선택 UI가 필요한데, 이 저장소엔 드롭다운/팝오버 컴포넌트가
   따로 없다. 새로 만들지 않고 네이티브 <details>/<summary>로 여닫는 작은 메뉴를 쓴다. */
export function StoryEditor() {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const videoMenuRef = useRef<HTMLDetailsElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [isAiModalOpen, setAiModalOpen] = useState(false);
  /* shouldRerenderOnTransaction을 명시적으로 true로 안 주면(기본값 취급 시) 이 설치 버전의
     useEditor가 트랜잭션마다 재렌더링을 트리거하지 않는다 — 굵게/기울임을 눌러도 버튼의
     isActive 표시가 안 바뀌던 원인이 이거였다. */
  const editor = useEditor({
    extensions,
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    /* CSS ::before 플레이스홀더는 스크린리더에 노출되지 않는다. 접근 가능한 이름은
       aria-label로 따로 붙인다. */
    editorProps: { attributes: { "aria-label": "프로젝트 소개 내용" } },
  });

  const insertImageFromFile = (file: File) => {
    if (!editor) return;
    if (file.size > MAX_IMAGE_BYTES) {
      window.alert("이미지는 5MB 이하만 삽입할 수 있어요.");
      return;
    }
    readFileAsDataUrl(file, (src) => editor.chain().focus().setImage({ src }).run());
  };

  const insertVideo = (src: string) => {
    if (!editor) return;
    if (isYoutubeUrl(src)) {
      editor.commands.setYoutubeVideo({ src });
    } else {
      editor.chain().focus().insertContent({ type: "video", attrs: { src } }).run();
    }
  };

  const insertVideoFromFile = (file: File) => {
    if (file.size > MAX_VIDEO_BYTES) {
      window.alert("영상은 20MB 이하만 삽입할 수 있어요.");
      return;
    }
    readFileAsDataUrl(file, insertVideo);
  };

  const closeVideoMenu = () => {
    if (videoMenuRef.current) videoMenuRef.current.open = false;
  };

  const onInsertVideoUrl = () => {
    closeVideoMenu();
    const url = window.prompt("YouTube 링크나 영상 URL을 입력해주세요.");
    if (url) insertVideo(url);
  };

  const onInsertVideoFile = () => {
    closeVideoMenu();
    videoInputRef.current?.click();
  };

  return (
    <div className="border-w-xs border-border-default mt-8 rounded-sm">
      <div className="flex items-center justify-between p-4">
        <span className="text-title-s font-semibold">프로젝트 소개</span>
        <button
          type="button"
          onClick={() => setAiModalOpen(true)}
          className={`${secondaryButtonClasses} h-9 px-4`}
        >
          AI로 펀딩 스토리 작성
        </button>
      </div>

      <div className="border-border-default flex items-center gap-3 border-y px-4 py-2">
        {formatButtons.map(({ icon, label, isActive, onClick }) => (
          <button
            key={icon}
            type="button"
            disabled={!editor}
            aria-label={label}
            aria-pressed={editor ? isActive(editor) : false}
            onClick={() => editor && onClick(editor)}
            className={toolbarButtonClasses(editor ? isActive(editor) : false)}
          >
            <Icon name={icon} className="size-4" />
          </button>
        ))}

        <button
          type="button"
          disabled={!editor}
          aria-label="이미지 삽입"
          onClick={() => imageInputRef.current?.click()}
          className={toolbarButtonClasses(false)}
        >
          <Icon name="insertImage" className="size-4" />
        </button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) insertImageFromFile(file);
            event.target.value = "";
          }}
        />

        <details ref={videoMenuRef} className="relative">
          <summary
            aria-label="동영상 삽입"
            onClick={(event) => {
              if (!editor) event.preventDefault();
            }}
            className={`${toolbarButtonClasses(false)} list-none [&::-webkit-details-marker]:hidden ${editor ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
          >
            <Icon name="insertVideo" className="size-4" />
          </summary>
          <div className="border-w-xs border-border-default bg-layer-surface-default shadow-light-s absolute top-full left-0 z-10 mt-1 flex w-32 flex-col overflow-hidden rounded-xs">
            <button
              type="button"
              onClick={onInsertVideoUrl}
              className="text-body-s text-text-default hover:bg-layer-surface-disabled px-3 py-2 text-left"
            >
              URL로 삽입
            </button>
            <button
              type="button"
              onClick={onInsertVideoFile}
              className="text-body-s text-text-default hover:bg-layer-surface-disabled px-3 py-2 text-left"
            >
              파일 선택
            </button>
          </div>
        </details>
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) insertVideoFromFile(file);
            event.target.value = "";
          }}
        />

        <button
          type="button"
          disabled={!editor}
          aria-label="글자 색상"
          onClick={() => colorInputRef.current?.click()}
          className={toolbarButtonClasses(false)}
        >
          <Icon name="colorPalette" className="size-4" />
        </button>
        <input
          ref={colorInputRef}
          type="color"
          className="hidden"
          onChange={(event) => editor?.chain().focus().setColor(event.target.value).run()}
        />
      </div>

      <EditorContent
        editor={editor}
        className="text-body-s [&_blockquote]:border-border-default [&_blockquote]:text-text-secondary [&_.tiptap]:h-100 [&_.tiptap]:overflow-y-auto [&_.tiptap]:p-4 [&_.tiptap]:outline-none [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_iframe]:max-w-full [&_img]:max-w-full [&_img]:rounded-xs [&_video]:max-w-full [&_video]:rounded-xs"
      />

      {isAiModalOpen && (
        <FundingStoryModal
          projectTitle="프로젝트"
          onClose={() => setAiModalOpen(false)}
          onImport={(body) => {
            editor?.chain().focus().setContent(storyBodyToHtml(body)).run();
            setAiModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
