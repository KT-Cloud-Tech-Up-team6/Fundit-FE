import { Icon } from "@/shared/components/ui/icon";
import {
  formatRecordDate,
  type FulfillmentRecord,
  type MediaItem,
} from "../model/fulfillment-demo";

type StageTimelineProps = {
  records: FulfillmentRecord[];
  onSelectMedia: (media: MediaItem) => void;
};

const mediaKindLabel = { image: "사진", video: "동영상" } as const;

export function StageTimeline({ records, onSelectMedia }: StageTimelineProps) {
  if (records.length === 0) {
    return <p className="text-body-s text-text-secondary">아직 등록된 기록이 없어요.</p>;
  }

  return (
    <ol>
      {records.map((record, index) => (
        <li key={record.id} className="flex gap-3">
          {/* 점 + 세로 연결선. 마지막 기록은 선을 이어가지 않는다. */}
          <span aria-hidden className="flex flex-col items-center pt-1">
            <span className="bg-text-secondary size-2 shrink-0 rounded-full" />
            {index < records.length - 1 && (
              <span className="bg-layer-surface-disabled w-px flex-1" />
            )}
          </span>

          <div className={index < records.length - 1 ? "flex-1 pb-6" : "flex-1"}>
            <p className="text-body-s text-text-secondary">{formatRecordDate(record.date)}</p>
            <p className="text-body-s text-text-default mt-1 whitespace-pre-wrap">{record.text}</p>
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
                      {/* ponytail: 업로드 서버가 없어 url이 없는 목업 기록은 회색 플레이스홀더로 둔다. */}
                      {media.url ? (
                        // eslint-disable-next-line @next/next/no-img-element -- objectURL이라 next/image 최적화 대상이 아니다.
                        <img src={media.url} alt="" className="size-full object-cover" />
                      ) : (
                        media.kind === "video" && (
                          <Icon name="play" className="text-text-secondary size-6" />
                        )
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
