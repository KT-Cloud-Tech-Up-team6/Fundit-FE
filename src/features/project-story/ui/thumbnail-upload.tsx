"use client";

import { useRef, useState } from "react";
import { secondaryButtonClasses } from "@/shared/components/ui/button";

/* ponytail: 업로드 서버가 없어 실제로 올리진 못하고, 선택한 파일명만 화면에 반영한다.
   업로드 API가 생기면 여기서 실제로 전송하고 반환된 URL을 저장하도록 바꾼다. */
export function ThumbnailUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <div className="mt-2 flex gap-2">
      <div
        aria-live="polite"
        className="text-body-s bg-layer-surface-disabled text-text-default flex h-10 flex-1 items-center overflow-hidden rounded-xs px-4"
      >
        <span className={fileName ? "truncate" : "text-text-disabled truncate"}>
          {fileName ?? "이미지를 첨부해주세요"}
        </span>
      </div>
      <button
        type="button"
        aria-label="썸네일 이미지 파일 선택"
        onClick={() => inputRef.current?.click()}
        className={`${secondaryButtonClasses} text-body-strong! h-10 w-20 shrink-0`}
      >
        찾아 보기
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) setFileName(file.name);
        }}
      />
    </div>
  );
}
