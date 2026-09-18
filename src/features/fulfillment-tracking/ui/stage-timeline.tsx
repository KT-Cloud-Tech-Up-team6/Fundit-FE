import { Badge } from "@/shared/components/ui/badge";
import { Icon } from "@/shared/components/ui/icon";
import {
  formatRecordDate,
  sortRecordsByDateDesc,
  type FulfillmentRecord,
  type MediaItem,
} from "../model/fulfillment-demo";

type StageTimelineProps = {
  records: FulfillmentRecord[];
  onSelectMedia: (media: MediaItem) => void;
  /** 없으면 "수정" 버튼을 숨긴다(작성영역이 없는 완료 단계). */
  onEditRecord?: (record: FulfillmentRecord) => void;
};

const mediaKindLabel = { image: "사진", video: "동영상" } as const;

export function StageTimeline({ records, onSelectMedia, onEditRecord }: StageTimelineProps) {
  const sorted = sortRecordsByDateDesc(records);

  if (sorted.length === 0) {
    return <p className="text-body-s text-text-secondary">아직 등록된 기록이 없어요.</p>;
  }

  return (
    <ol className="flex flex-col">
      {sorted.map((record, index) => (
        <li className="flex gap-[11px]" key={record.id}>
          {/* 점 + 세로 연결선. 마지막 기록은 선을 이어가지 않는다.
              ponytail: 오늘 날짜를 채우지 않은 원(링)으로 구분하는 Figma 디테일은 값 대비가 작아 생략한다. */}
          <span aria-hidden className="flex w-[18px] shrink-0 flex-col items-center pt-1.5">
            <span
              className={`size-2 shrink-0 rounded-full ${record.delayed ? "bg-status-warning" : "bg-text-secondary"}`}
            />
            {index < sorted.length - 1 && (
              <span className="bg-layer-surface-disabled mt-1 w-px flex-1" />
            )}
          </span>

          <div
            className={`flex min-w-0 flex-1 flex-col ${index < sorted.length - 1 ? "pb-4" : ""}`}
          >
            <div className="flex items-center gap-[11px]">
              <p className="text-caption-s text-text-secondary">{formatRecordDate(record.date)}</p>
              {record.delayed && (
                <Badge shape="rounded" variant="warning">
                  지연
                </Badge>
              )}
              {record.edited && (
                <Badge shape="rounded" variant="caution">
                  수정 됨
                </Badge>
              )}
            </div>
            <p className="text-body-s text-text-default mt-[11px] whitespace-pre-wrap">
              {record.text}
            </p>
            {record.media.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-2">
                {record.media.map((media) => (
                  <li key={media.id}>
                    <button
                      type="button"
                      aria-label={`${media.name} ${mediaKindLabel[media.kind]} 크게 보기`}
                      onClick={() => onSelectMedia(media)}
                      className="bg-layer-surface-disabled relative flex size-16 cursor-pointer items-center justify-center overflow-hidden rounded-xs"
                    >
                      {/* 동영상은 objectURL이 있어도 img로 렌더하면 썸네일이 깨진다.
                          MediaDropzone처럼 이미지만 img로 두고 동영상은 재생 아이콘으로 표시한다.
                          ponytail: url이 없는 목업 기록은 회색 플레이스홀더로 둔다. */}
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
            {onEditRecord && (
              <button
                className="text-caption-s text-text-secondary mt-1 flex h-6 shrink-0 items-center self-end rounded-xs px-2 underline"
                onClick={() => onEditRecord(record)}
                type="button"
              >
                수정
              </button>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
