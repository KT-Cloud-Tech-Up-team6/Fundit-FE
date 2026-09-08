import type { MediaItem } from "../model/fulfillment-demo";
import { Modal } from "@/shared/components/ui/modal";

type MediaLightboxProps = {
  media: MediaItem | null;
  onClose: () => void;
};

/** 썸네일을 클릭했을 때 원본을 크게 보여주는 라이트박스(Figma 488:8106). */
export function MediaLightbox({ media, onClose }: MediaLightboxProps) {
  if (media === null) return null;

  return (
    <Modal open onClose={onClose} title={media.name}>
      {media.url ? (
        media.kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element -- objectURL이라 next/image의 최적화 대상이 아니다.
          <img alt={media.name} className="max-h-[70dvh] w-full object-contain" src={media.url} />
        ) : (
          <video className="max-h-[70dvh] w-full object-contain" controls src={media.url} />
        )
      ) : (
        /* ponytail: 목업 기록의 첨부는 objectURL이 없다. 업로드 API가 생기면 url이 채워져
           위 분기로 들어가므로 이 자리는 그대로 비어 있는 상태 표시로 남는다. */
        <div className="flex flex-col items-center gap-2">
          <div className="bg-layer-surface-disabled aspect-[4/3] w-full rounded-xs" />
          <p className="text-body-s text-text-secondary">
            {media.name} — 미리보기가 없는 첨부예요.
          </p>
        </div>
      )}
    </Modal>
  );
}
