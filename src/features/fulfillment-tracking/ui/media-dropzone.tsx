"use client";

import { useRef, useState } from "react";
import type { DragEvent } from "react";
import {
  addMedia,
  defaultMediaLimit,
  mediaCounts,
  mediaKindOf,
  removeMedia,
} from "../model/fulfillment-demo";
import type { MediaItem, MediaLimit } from "../model/fulfillment-demo";
import { Icon } from "@/shared/components/ui/icon";

const browseButtonClasses =
  "bg-layer-surface-primary text-text-inverse flex h-7 shrink-0 items-center justify-center rounded-xs px-3 text-caption-s whitespace-nowrap";

type MediaDropzoneProps = {
  media: MediaItem[];
  onChange: (media: MediaItem[]) => void;
  onPreview: (media: MediaItem) => void;
  /** 화면별 첨부 한도. 0이면 그 종류는 고를 수도, 안내에 나오지도 않는다. */
  limit?: MediaLimit;
};

/** 첨부 결과를 aria-live로 읽어줄 한 문장으로 만든다. */
function noticeOf(
  accepted: MediaItem[],
  rejected: MediaItem[],
  ignored: number,
  limit: MediaLimit,
): string {
  const acceptedCounts = mediaCounts(accepted);
  const rejectedCounts = mediaCounts(rejected);

  return [
    acceptedCounts.image > 0 && `사진 ${acceptedCounts.image}개를 첨부했어요.`,
    acceptedCounts.video > 0 && `동영상 ${acceptedCounts.video}개를 첨부했어요.`,
    rejectedCounts.image > 0 &&
      (limit.image > 0
        ? `사진은 최대 ${limit.image}장까지 첨부할 수 있어 ${rejectedCounts.image}개를 제외했어요.`
        : `사진은 첨부할 수 없어 ${rejectedCounts.image}개를 제외했어요.`),
    rejectedCounts.video > 0 &&
      (limit.video > 0
        ? `동영상은 최대 ${limit.video}개까지 첨부할 수 있어 ${rejectedCounts.video}개를 제외했어요.`
        : `동영상은 첨부할 수 없어 ${rejectedCounts.video}개를 제외했어요.`),
    ignored > 0 && `사진·동영상이 아닌 파일 ${ignored}개는 첨부할 수 없어요.`,
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * 기록에 붙일 사진·동영상 첨부 영역(Figma 1319:40988의 열린 상태).
 *
 * 전송은 하지 않고 고른 파일과 objectURL 미리보기만 넘긴다.
 * 실제 업로드는 호출 화면이 MediaItem.file로 한다(seller-fulfillment-api).
 *
 * ponytail: objectURL 해제는 "한도 초과로 버린 항목"에서만 한다 — 그 URL만 이 함수가 만들고
 * 아무 데도 넘기지 않아 확실히 주인이다. 목록에 올라간 항목은 수정 폼이 기존 기록과 같은 URL을
 * 공유하므로(저장 안 한 삭제 → 취소 시 기록 썸네일이 깨진다) 해제하지 않는다.
 * 누수는 페이지 수명으로 한정된다.
 */
export function MediaDropzone({
  media,
  onChange,
  onPreview,
  limit = defaultMediaLimit,
}: MediaDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState("");
  const counts = mediaCounts(media);
  const kindLabel = [limit.image > 0 && "사진", limit.video > 0 && "동영상"]
    .filter(Boolean)
    .join("·");

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
        file,
      });
    }

    const { media: next, rejected } = addMedia(media, incoming, limit);
    const rejectedIds = new Set(rejected.map((item) => item.id));
    /* 한도를 넘겨 버릴 항목의 objectURL은 쓰이지 않으니 바로 해제한다. */
    for (const item of rejected) if (item.url) URL.revokeObjectURL(item.url);

    onChange(next);
    setNotice(
      noticeOf(
        incoming.filter((item) => !rejectedIds.has(item.id)),
        rejected,
        ignored,
        limit,
      ),
    );
  }

  function remove(item: MediaItem) {
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
      className={browseButtonClasses}
      onClick={(event) => {
        event.stopPropagation();
        inputRef.current?.click();
      }}
      type="button"
    >
      찾아보기
    </button>
  );

  return (
    /* ponytail: 영역 전체를 클릭 대상으로 두되 키보드 경로는 "찾아보기" 버튼이 담당한다.
       div를 button으로 만들면 안에 든 삭제·미리보기 버튼이 중첩돼 못 쓴다. */
    <div
      className={[
        "bg-layer-bg border-w-xs flex flex-col gap-3 rounded-sm border-dashed px-4 py-6",
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
        <div className="flex flex-col items-center gap-2 text-center">
          <Icon className="text-text-secondary size-9" name="uploadFile" />
          <p className="text-body-s text-text-secondary">
            제작 진행 상황을 보여주는 사진(최대 {limit.image}장)
            {limit.video > 0 && `·동영상(최대 ${limit.video}개)`}을 드래그하거나 클릭하여 첨부해
            주세요.
          </p>
          {browseButton}
        </div>
      ) : (
        <>
          <p className="text-caption-strong text-text-secondary">
            {kindLabel}을 추가하려면 드래그하거나 클릭해 주세요.
          </p>
          <ul className="flex flex-wrap gap-2">
            {media.map((item) => (
              <li className="relative" key={item.id}>
                <button
                  aria-label={`${item.name} 미리보기`}
                  className="border-w-xs border-border-default bg-layer-surface-default focus-visible:outline-border-primary flex size-14 items-center justify-center overflow-hidden rounded-xs focus-visible:outline-2"
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
                  className="focus-visible:outline-border-primary absolute -top-1 -right-1 flex size-3.5 items-center justify-center rounded-full focus-visible:outline-2"
                  onClick={(event) => {
                    event.stopPropagation();
                    remove(item);
                  }}
                  type="button"
                >
                  {/* Figma "cancel_circle_filled"은 진한 원 배경 + 흰 X 2색 자산이라
                      Icon의 mask 렌더링(단색만 지원)을 쓰면 X가 사라진다. 원색 그대로 쓰려 img로 둔다. */}
                  {/* eslint-disable-next-line @next/next/no-img-element -- 장식 아이콘, 최적화 대상 아님 */}
                  <img alt="" className="size-3.5" src="/icons/cancel_circle_filled.svg" />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center justify-end gap-[11px]">
            <p className="text-caption-s text-text-secondary">
              사진 {counts.image}/{limit.image}
            </p>
            {limit.video > 0 && (
              <>
                <p className="text-caption-s text-text-secondary">·</p>
                <p className="text-caption-s text-text-secondary">
                  동영상 {counts.video}/{limit.video}
                </p>
              </>
            )}
            {browseButton}
          </div>
        </>
      )}

      <p aria-live="polite" className="sr-only">
        {notice}
      </p>

      <input
        accept={[limit.image > 0 && "image/*", limit.video > 0 && "video/*"]
          .filter(Boolean)
          .join(",")}
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
