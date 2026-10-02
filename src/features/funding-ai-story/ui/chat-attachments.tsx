import { Icon } from "@/shared/components/ui/icon";

/** 입력창에 붙인 첨부. `fileUrl`이 null이면 아직 올리는 중이다. */
export type ChatAttachmentDraft = {
  id: string;
  name: string;
  /** 고른 파일의 objectURL. 보낸 뒤에도 답변이 끝날 때까지 미리보기에 쓴다. */
  previewUrl: string;
  fileUrl: string | null;
};

/*
 * 첨부 미리보기·업로드 상태·메시지 안 이미지는 Figma(1260:26893, DS input_chat 548:4476)에 시안이 없다(#556).
 * 반품 신청의 사진 첨부(funding-cancel)와 같은 썸네일 + 오른쪽 위 지우기 버튼 모양을 쓴다.
 */
export function ChatAttachmentTray({
  items,
  error,
  disabled,
  onRemove,
}: {
  items: ChatAttachmentDraft[];
  error: string;
  disabled: boolean;
  onRemove: (id: string) => void;
}) {
  const uploading = items.filter((item) => item.fileUrl === null).length;
  if (!items.length && !error) return null;
  return (
    <div className="mb-2 flex shrink-0 flex-col gap-2">
      {items.length > 0 && (
        <ul aria-label="첨부한 이미지" className="flex gap-2 overflow-x-auto pt-1 pr-1">
          {items.map((item) => (
            <li key={item.id} className="relative size-14 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element -- objectURL이라 next/image 최적화 대상이 아니다. */}
              <img
                src={item.previewUrl}
                alt={item.name}
                className={`size-full rounded-xs object-cover ${item.fileUrl === null ? "opacity-40" : ""}`}
              />
              {item.fileUrl === null && (
                <span
                  aria-hidden
                  className="border-border-default border-t-border-primary absolute inset-0 m-auto size-5 animate-spin rounded-full border-2"
                />
              )}
              <button
                type="button"
                aria-label={`${item.name} 첨부 삭제`}
                disabled={disabled}
                onClick={() => onRemove(item.id)}
                className="bg-layer-surface-primary text-text-inverse disabled:bg-layer-surface-disabled absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full"
              >
                <Icon name="closeSmall" className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p role="status" className="sr-only">
        {uploading ? `이미지 ${uploading}개를 올리는 중입니다.` : ""}
      </p>
      {error && (
        <p role="alert" className="text-caption-s text-text-error break-keep whitespace-pre-line">
          {error}
        </p>
      )}
    </div>
  );
}

/** 보낸 사용자 메시지의 이미지. 세션의 `file_url`이나 답변 전 미리보기 주소를 그린다. */
export function ChatImages({ urls }: { urls: string[] }) {
  return (
    <ul aria-label="보낸 이미지" className="flex flex-wrap justify-end gap-1">
      {urls.map((url, index) => (
        <li key={`${url}-${index}`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- objectURL과 CDN 주소를 함께 그린다. */}
          <img
            src={url}
            alt={`보낸 이미지 ${index + 1}`}
            className="size-30 rounded-xs object-cover"
          />
        </li>
      ))}
    </ul>
  );
}
