"use client";

import { useRef, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { InputButton } from "@/shared/components/ui/input-button";

/* ponytail: 업로드 서버가 없어 실제로 올리진 못하고, 선택한 파일명만 화면에 반영한다.
   업로드 API가 생기면 여기서 실제로 전송하고 반환된 URL을 저장하도록 바꾼다. */
export function ThumbnailUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <>
      <InputButton
        inputProps={{
          id: "story-thumbnail-name",
          readOnly: true,
          value: fileName ?? "",
          placeholder: "이미지를 첨부해주세요",
          shape: "compact",
          className:
            "bg-layer-surface-disabled border-transparent [&_input]:text-body-s [&_input]:text-text-secondary [&_input]:font-bold [&_input]:placeholder:text-body-s",
        }}
        button={
          <Button
            variant="secondary"
            size="xl"
            appearance="cta"
            aria-label="썸네일 이미지 파일 선택"
            onClick={() => inputRef.current?.click()}
            className="w-18"
          >
            찾아보기
          </Button>
        }
      />
      <span className="sr-only" aria-live="polite">
        {fileName}
      </span>
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
    </>
  );
}
