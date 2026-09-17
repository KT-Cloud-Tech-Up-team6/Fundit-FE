"use client";

import Image from "next/image";
import { useState } from "react";
import { Badge } from "@/shared/components/ui/badge";
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
  showLatestBadge?: boolean;
};

const mediaKindLabel = { image: "사진", video: "동영상" } as const;

export function BuyerTimeline({
  records,
  onSelectMedia,
  collapsibleItems = false,
  showLatestBadge = true,
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
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-[11px]">
                <p
                  className={`text-caption-s font-medium ${collapsibleItems && isLatest ? "text-text-default" : "text-text-secondary"}`}
                >
                  {formatRecordDate(record.date)}
                </p>
                {isLatest && showLatestBadge && (
                  <Badge shape="rounded" variant="success">
                    업데이트
                  </Badge>
                )}
                {record.delayed && (
                  <Badge shape="rounded" variant="warning">
                    지연
                  </Badge>
                )}
              </div>

              <p
                className={`text-body-s mt-2 leading-[1.42] ${collapsibleItems && !isLatest ? "text-text-secondary" : "text-text-default"} ${open ? "whitespace-pre-wrap" : "truncate"}`}
              >
                {open ? record.text : record.text.replace(/\n/g, " ")}
              </p>

              {open && record.media.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-3">
                  {record.media.map((media) => (
                    <li key={media.id}>
                      <button
                        type="button"
                        aria-label={`${media.name} ${mediaKindLabel[media.kind]} 크게 보기`}
                        onClick={() => onSelectMedia(media)}
                        className="bg-layer-surface-disabled relative flex size-20 cursor-pointer items-center justify-center overflow-hidden rounded-xs"
                      >
                        {/* 이미지는 objectURL이 있을 때 썸네일로, 동영상은 재생 아이콘으로
                            표시한다. 목업 이미지처럼 url이 없으면 회색 자리만 남긴다. */}
                        {media.url && media.kind === "image" ? (
                          // eslint-disable-next-line @next/next/no-img-element -- objectURL이라 next/image 최적화 대상이 아니다.
                          <img src={media.url} alt="" className="size-full object-cover" />
                        ) : media.kind === "video" ? (
                          <Icon name="play" className="text-text-secondary size-6" />
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
                <Image
                  src="/images/fulfillment/arrow-down.svg"
                  width={14}
                  height={14}
                  alt=""
                  className={open ? "rotate-180" : ""}
                />
              </button>
            )}
          </li>
        );
      })}
    </ol>
  );
}
