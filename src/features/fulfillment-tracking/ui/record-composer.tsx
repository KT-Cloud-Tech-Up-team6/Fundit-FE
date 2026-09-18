"use client";

import { useId, useRef, useState } from "react";
import { canSubmit, todayValue } from "../model/fulfillment-demo";
import type { MediaItem } from "../model/fulfillment-demo";
import { MediaDropzone } from "./media-dropzone";
import { Button } from "@/shared/components/ui/button";
import { DateField } from "@/shared/components/ui/date-field";
import { Icon } from "@/shared/components/ui/icon";

type RecordComposerProps = {
  onSubmit: (input: { date: string; text: string; media: MediaItem[] }) => void;
  onOpenDelay: () => void;
  onPreviewMedia: (media: MediaItem) => void;
  /** "수정" 클릭으로 불러온 기존 기록값. 부모가 `key`를 바꿔 다시 마운트시킨다. */
  initialDate?: string;
  initialText?: string;
};

/** Figma "지연 사유 등록" 경고 버튼(border/accent_warning + text/warning). */
const delayButtonClasses =
  "border-border-accent-warning bg-layer-surface-default text-text-warning text-body-s focus-visible:outline-border-primary flex h-9 shrink-0 items-center justify-center rounded-xs border px-2 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2";

/** 선택한 단계에 기록을 추가하는 작성영역(Figma step_entry_form, 1319:40858). */
export function RecordComposer({
  onSubmit,
  onOpenDelay,
  onPreviewMedia,
  initialDate,
  initialText = "",
}: RecordComposerProps) {
  const dropzoneId = useId();
  const textRef = useRef<HTMLTextAreaElement>(null);
  const [date, setDate] = useState(initialDate ?? todayValue);
  const [text, setText] = useState(initialText);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [dropzoneOpen, setDropzoneOpen] = useState(false);

  return (
    <form
      className="flex flex-col gap-[15px] p-4"
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <DateField
          aria-label="기록 날짜"
          onChange={setDate}
          placeholder="날짜를 선택하세요"
          value={date}
        />
        <button className={delayButtonClasses} onClick={onOpenDelay} type="button">
          지연 사유 등록
        </button>
      </div>

      {/* aria-controls가 가리킬 대상은 닫혀 있어도 있어야 해서 언마운트 대신 hidden으로 접는다. */}
      <div hidden={!dropzoneOpen} id={dropzoneId}>
        <MediaDropzone media={media} onChange={setMedia} onPreview={onPreviewMedia} />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="border-w-xs border-border-default bg-layer-surface-default focus-within:border-border-primary flex min-h-13 w-full min-w-0 items-start gap-2 rounded-xs px-4 py-3">
          <button
            aria-controls={dropzoneId}
            aria-expanded={dropzoneOpen}
            aria-label={dropzoneOpen ? "첨부 닫기" : "첨부 열기"}
            className="text-text-secondary mt-0.5 flex size-4 shrink-0 items-center justify-center"
            onClick={() => setDropzoneOpen((open) => !open)}
            type="button"
          >
            <Icon className="size-4" name="linkChain" />
          </button>
          {/* 여러 줄 진행 내용을 그대로 보여주려 input 대신 textarea를 쓴다.
              field-sizing:content로 rows 없이 내용만큼 자동으로 늘어난다(rung: 네이티브 CSS). */}
          <textarea
            aria-label="진행 내용"
            className="text-body-s placeholder:text-text-disabled [field-sizing:content] min-w-0 flex-1 resize-none bg-transparent outline-none"
            onChange={(event) => setText(event.target.value)}
            placeholder="업데이트될 진행 사항을 입력해주세요"
            ref={textRef}
            rows={1}
            value={text}
          />
        </div>
        <Button
          appearance="cta"
          className="w-full shrink-0 px-10 sm:w-auto"
          disabled={!canSubmit(text)}
          size="xl"
          type="submit"
        >
          등록
        </Button>
      </div>
    </form>
  );
}
