"use client";

import { useState } from "react";
import { Icon } from "@/shared/components/ui/icon";
import {
  formatRecordDate,
  latestRecordId,
  sortRecordsByDateDesc,
  type FulfillmentRecord,
  type MediaItem,
} from "../model/fulfillment-demo";

type BuyerTimelineProps = {
  records: FulfillmentRecord[];
  onSelectMedia: (media: MediaItem) => void;
  /**
   * 화면1(요약): 최신 기록만 펼쳐 두고 나머지는 접는다. chevron 토글이 붙는다.
   * 미지정(화면2, 전체 이력): 전부 펼친다.
   */
  collapsibleItems?: boolean;
};

const mediaKindLabel = { image: "사진", video: "동영상" } as const;

export function BuyerTimeline({
  records,
  onSelectMedia,
  collapsibleItems = false,
}: BuyerTimelineProps) {
  const sorted = sortRecordsByDateDesc(records);
  const latestId = latestRecordId(records);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (sorted.length === 0) {
    return <p className="text-body-s text-text-secondary">아직 등록된 기록이 없어요.</p>;
  }

  return (
    <ol className="w-full">
      {sorted.map((record, index) => {
        const isLatest = record.id === latestId;
        const images = record.media.filter((media) => media.kind === "image");
        const collapsible = collapsibleItems && !isLatest;
        const open = !collapsible || expanded[record.id] === true;
        const isLastRow = index === sorted.length - 1;

        return (
          <li
            key={record.id}
            className={`flex items-start gap-[11px] py-3 ${
              isLastRow ? "" : "border-border-default border-b"
            }`}
          >
            {/* dot + 세로 연결선 — SVG 대신 토큰 div로 그린다(판매자 stage-timeline과 동일). */}
            <span aria-hidden className="flex flex-col items-center pt-1">
              <span
                className={`size-[14px] shrink-0 rounded-full ${
                  isLatest ? "bg-layer-surface-primary" : "bg-layer-surface-disabled"
                }`}
              />
              {!isLastRow && <span className="bg-layer-surface-disabled mt-1 w-px flex-1" />}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-caption-s text-text-secondary flex items-center gap-2">
                  <span>{formatRecordDate(record.date)}</span>
                  {record.delayed && <span className="text-warning">지연</span>}
                </p>
                {isLatest && (
                  <span className="bg-layer-surface-disabled text-label-m text-text-default shrink-0 rounded-full px-2 py-1">
                    업데이트
                  </span>
                )}
              </div>

              <p
                className={`text-body-s text-text-default mt-2 whitespace-pre-wrap ${
                  open ? "line-clamp-3" : "line-clamp-1"
                }`}
              >
                {record.text}
              </p>

              {open && images.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-3">
                  {images.map((media) => (
                    <li key={media.id}>
                      <button
                        type="button"
                        aria-label={`${media.name} ${mediaKindLabel[media.kind]} 크게 보기`}
                        onClick={() => onSelectMedia(media)}
                        className="bg-layer-surface-disabled relative flex size-20 cursor-pointer items-center justify-center overflow-hidden rounded-xs"
                      >
                        {/* ponytail: 목업 기록의 첨부는 objectURL이 없어 회색 플레이스홀더로 둔다.
                            업로드 API가 생기면 url이 채워져 아래 분기로 들어간다. */}
                        {media.url ? (
                          // eslint-disable-next-line @next/next/no-img-element -- objectURL이라 next/image 최적화 대상이 아니다.
                          <img src={media.url} alt="" className="size-full object-cover" />
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {collapsible && (
              <button
                type="button"
                aria-expanded={open}
                aria-label={
                  open
                    ? `${formatRecordDate(record.date)} 기록 접기`
                    : `${formatRecordDate(record.date)} 기록 펼치기`
                }
                onClick={() => setExpanded((prev) => ({ ...prev, [record.id]: !prev[record.id] }))}
                className="text-text-secondary flex shrink-0 cursor-pointer items-center justify-center p-1"
              >
                {/* frequently/arrow_up는 arrow_down 셰브런을 뒤집은 것과 같다(별도 에셋 없음). */}
                <Icon name="arrowDown" className={`size-3.5 ${open ? "rotate-180" : ""}`} />
              </button>
            )}
          </li>
        );
      })}
    </ol>
  );
}
