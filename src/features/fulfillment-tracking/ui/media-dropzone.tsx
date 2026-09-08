"use client";

import { useRef, useState } from "react";
import type { DragEvent } from "react";
import {
  addMedia,
  maxImages,
  maxVideos,
  mediaCounts,
  mediaKindOf,
  removeMedia,
} from "../model/fulfillment-demo";
import type { MediaItem } from "../model/fulfillment-demo";
import { secondaryButtonClasses } from "@/shared/components/ui/button";
import { Icon } from "@/shared/components/ui/icon";

type MediaDropzoneProps = {
  media: MediaItem[];
  onChange: (media: MediaItem[]) => void;
  onPreview: (media: MediaItem) => void;
};

/** 첨부 결과를 aria-live로 읽어줄 한 문장으로 만든다. */
function noticeOf(accepted: MediaItem[], rejected: MediaItem[], ignored: number): string {
  const acceptedCounts = mediaCounts(accepted);
  const rejectedCounts = mediaCounts(rejected);

  return [
    acceptedCounts.image > 0 && `사진 ${acceptedCounts.image}개를 첨부했어요.`,
    acceptedCounts.video > 0 && `동영상 ${acceptedCounts.video}개를 첨부했어요.`,
    rejectedCounts.image > 0 &&
      `사진은 최대 ${maxImages}장까지 첨부할 수 있어 ${rejectedCounts.image}개를 제외했어요.`,
    rejectedCounts.video > 0 &&
      `동영상은 최대 ${maxVideos}개까지 첨부할 수 있어 ${rejectedCounts.video}개를 제외했어요.`,
    ignored > 0 && `사진·동영상이 아닌 파일 ${ignored}개는 첨부할 수 없어요.`,
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * 기록에 붙일 사진·동영상 첨부 영역(Figma 488:7943 / 488:8020).
 *
 * ponytail: 업로드 서버가 없어 실제 전송은 없고 objectURL로 미리보기만 만든다.
 * 업로드 API가 생기면 여기서 전송하고 반환 URL을 MediaItem.url에 넣는다(thumbnail-upload와 같은 방침).
 *
 * ponytail: objectURL 해제는 "삭제"와 "한도 초과로 버린 항목"에서만 한다. 언마운트 시 남은 첨부까지
 * 해제하면 이미 등록된 기록의 썸네일이 깨진다 — URL의 수명이 이 컴포넌트보다 길다.
 * 목업이라 누수는 페이지 수명으로 한정된다. 업로드 API가 생기면 objectURL 자체가 사라진다.
 */
export function MediaDropzone({ media, onChange, onPreview }: MediaDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState("");
  const counts = mediaCounts(media);

  function accept(files: FileList | null) {
    if (!files || files.length === 0) return;

    const incoming: MediaItem[] = [];
    let ignored = 0;
    for (const file of Array.from(files)) {
      const kind = mediaKindOf(file.type);
      if (kind === null) {
        ignored += 1;
        continue;
      }
      incoming.push({
        id: crypto.randomUUID(),
        kind,
        name: file.name,
        url: URL.createObjectURL(file),
      });
    }

    const { media: next, rejected } = addMedia(media, incoming);
    const rejectedIds = new Set(rejected.map((item) => item.id));
    /* 한도를 넘겨 버릴 항목의 objectURL은 쓰이지 않으니 바로 해제한다. */
    for (const item of rejected) if (item.url) URL.revokeObjectURL(item.url);

    onChange(next);
    setNotice(
      noticeOf(
        incoming.filter((item) => !rejectedIds.has(item.id)),
        rejected,
        ignored,
      ),
    );
  }

  function remove(item: MediaItem) {
    if (item.url) URL.revokeObjectURL(item.url);
    onChange(removeMedia(media, item.id));
    setNotice(`${item.name} 첨부를 삭제했어요.`);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    accept(event.dataTransfer.files);
  }

  const browseButton = (
    <button
      className={`${secondaryButtonClasses} h-9 shrink-0 px-3`}
      onClick={(event) => {
        event.stopPropagation();
        inputRef.current?.click();
      }}
      type="button"
    >
      찾아 보기
    </button>
  );

  return (
    /* ponytail: 영역 전체를 클릭 대상으로 두되 키보드 경로는 "찾아 보기" 버튼이 담당한다.
       div를 button으로 만들면 안에 든 삭제·미리보기 버튼이 중첩돼 못 쓴다. */
    <div
      className={[
        "bg-layer-surface-disabled flex flex-col gap-2 rounded-xs border-2 border-dashed p-4",
        dragging ? "border-border-primary" : "border-border-default",
      ].join(" ")}
      onClick={() => inputRef.current?.click()}
      onDragLeave={() => setDragging(false)}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDrop={handleDrop}
    >
      {media.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          {/* ponytail: Icon에 업로드 아이콘이 없어 텍스트 안내만 둔다. 아이콘이 추가되면 여기에 넣는다. */}
          <p className="text-caption-s text-text-secondary">
            제작 진행 상황을 보여주는 사진(최대 {maxImages}장)·동영상(최대 {maxVideos}개)을
            드래그하거나 클릭하여 첨부해 주세요.
          </p>
          {browseButton}
        </div>
      ) : (
        <>
          <p className="text-caption-s text-text-secondary">
            사진·동영상을 추가하려면 드래그하거나 클릭해 주세요.
          </p>
          <ul className="flex flex-wrap gap-2">
            {media.map((item) => (
              <li className="relative" key={item.id}>
                <button
                  aria-label={`${item.name} 미리보기`}
                  className="border-w-xs border-border-default bg-layer-surface-default focus-visible:outline-border-primary flex size-16 items-center justify-center overflow-hidden rounded-xs focus-visible:outline-2"
                  onClick={(event) => {
                    event.stopPropagation();
                    onPreview(item);
                  }}
                  type="button"
                >
                  {item.url && item.kind === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element -- objectURL이라 next/image 최적화 대상이 아니다.
                    <img alt="" className="size-full object-cover" src={item.url} />
                  ) : item.kind === "image" ? (
                    <span className="text-caption-strong text-text-secondary">IMG</span>
                  ) : (
                    <Icon className="text-text-secondary size-5" name="play" />
                  )}
                </button>
                <button
                  aria-label={`${item.name} 첨부 삭제`}
                  className="bg-layer-surface-primary text-text-inverse focus-visible:outline-border-primary absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full focus-visible:outline-2"
                  onClick={(event) => {
                    event.stopPropagation();
                    remove(item);
                  }}
                  type="button"
                >
                  <Icon className="size-3" name="close" />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-end gap-2">
            <p className="text-caption-s text-text-secondary">
              사진 {counts.image}/{maxImages} · 동영상 {counts.video}/{maxVideos}
            </p>
            {browseButton}
          </div>
        </>
      )}

      <p aria-live="polite" className="sr-only">
        {notice}
      </p>

      <input
        accept="image/*,video/*"
        className="hidden"
        multiple
        onChange={(event) => {
          accept(event.target.files);
          /* 같은 파일을 다시 고를 수 있게 값을 비운다. */
          event.target.value = "";
        }}
        ref={inputRef}
        type="file"
      />
    </div>
  );
}
