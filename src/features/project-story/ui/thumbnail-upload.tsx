"use client";

import { useRef, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { InputButton } from "@/shared/components/ui/input-button";

/* 선택한 파일을 부모에 전달한다. 서버 업로드 또는 데모 미리보기는 부모가 처리한다. */
export function ThumbnailUpload({
  onFileChange,
  initialName = "",
}: {
  onFileChange: (file: File) => void;
  initialName?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(initialName);

  return (
    <>
      <InputButton
        inputProps={{
          id: "story-thumbnail-name",
          readOnly: true,
          value: fileName ?? "",
          placeholder: "썸네일 이미지를 첨부해주세요",
          shape: "compact",
          className:
            "bg-layer-surface-disabled border-transparent [&_input]:text-body-s [&_input]:leading-[1.42] [&_input]:text-text-secondary [&_input]:placeholder:text-body-s",
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
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            setFileName(file.name);
            onFileChange(file);
          }
        }}
      />
    </>
  );
}
