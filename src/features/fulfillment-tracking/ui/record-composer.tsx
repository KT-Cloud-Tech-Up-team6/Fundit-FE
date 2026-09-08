"use client";

import { useId, useRef, useState } from "react";
import { canSubmit, todayValue } from "../model/fulfillment-demo";
import type { MediaItem } from "../model/fulfillment-demo";
import { MediaDropzone } from "./media-dropzone";
import { Button, secondaryButtonClasses } from "@/shared/components/ui/button";
import { Icon } from "@/shared/components/ui/icon";

type RecordComposerProps = {
  onSubmit: (input: { date: string; text: string; media: MediaItem[] }) => void;
  onOpenDelay: () => void;
  onPreviewMedia: (media: MediaItem) => void;
};

/* 네이티브 <input type="date">. 달력 UI는 브라우저가 갖고 있어 라이브러리를 두지 않는다. */
const dateInputClasses =
  "border-w-xs border-border-default bg-layer-surface-default text-body-emphasis text-text-default focus-visible:outline-border-primary h-11 rounded-xs px-4 focus-visible:outline-2";

/** 선택한 단계에 기록을 추가하는 작성영역(Figma 488:7900). */
export function RecordComposer({ onSubmit, onOpenDelay, onPreviewMedia }: RecordComposerProps) {
  const dropzoneId = useId();
  const textRef = useRef<HTMLInputElement>(null);
  const [date, setDate] = useState(todayValue);
  const [text, setText] = useState("");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [dropzoneOpen, setDropzoneOpen] = useState(false);

  return (
    <form
      className="flex flex-col gap-2 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSubmit(text)) return;

        onSubmit({ date, text: text.trim(), media });
        setText("");
        setMedia([]);
        setDropzoneOpen(false);
        textRef.current?.focus();
      }}
    >
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <label className="sr-only" htmlFor={`${dropzoneId}-date`}>
          기록 날짜
        </label>
        <input
          className={dateInputClasses}
          id={`${dropzoneId}-date`}
          onChange={(event) => setDate(event.target.value)}
          type="date"
          value={date}
        />
        <button
          className={`${secondaryButtonClasses} h-11 px-4`}
          onClick={onOpenDelay}
          type="button"
        >
          지연 사유 등록
        </button>
      </div>

      {/* aria-controls가 가리킬 대상은 닫혀 있어도 있어야 해서 언마운트 대신 hidden으로 접는다. */}
      <div hidden={!dropzoneOpen} id={dropzoneId}>
        <MediaDropzone media={media} onChange={setMedia} onPreview={onPreviewMedia} />
      </div>

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        {/* shared Input은 endAdornment(오른쪽)만 지원한다. Figma는 아이콘이 입력 왼쪽 안쪽이라
            Input과 같은 클래스 조합으로 같은 외형을 만든다. shared 컴포넌트는 고치지 않는다. */}
        <div className="border-w-xs border-border-default bg-layer-surface-default focus-within:border-border-primary flex h-13 w-full min-w-0 items-center gap-2 overflow-hidden rounded-sm py-1 pr-4 pl-2">
          <button
            aria-controls={dropzoneId}
            aria-expanded={dropzoneOpen}
            aria-label={dropzoneOpen ? "첨부 닫기" : "첨부 열기"}
            className="text-text-secondary hover:bg-layer-surface-disabled focus-visible:outline-border-primary flex size-9 shrink-0 items-center justify-center rounded-xs focus-visible:outline-2"
            onClick={() => setDropzoneOpen((open) => !open)}
            type="button"
          >
            <Icon className="size-5" name="insertImage" />
          </button>
          <input
            aria-label="진행 내용"
            className="text-body-m placeholder:text-body-s text-text-default placeholder:text-text-disabled min-w-0 flex-1 bg-transparent outline-none"
            onChange={(event) => setText(event.target.value)}
            placeholder="단계에 추가될 내용을 적어주세요"
            ref={textRef}
            value={text}
          />
        </div>
        <Button className="w-full px-6 lg:w-auto" disabled={!canSubmit(text)} type="submit">
          등록
        </Button>
      </div>
    </form>
  );
}
