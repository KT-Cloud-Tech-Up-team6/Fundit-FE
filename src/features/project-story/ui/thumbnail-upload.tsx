"use client";

import { useRef, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { InputButton } from "@/shared/components/ui/input-button";

/* 파일은 서버에 업로드하지 않고 이름 표시와 로컬 미리보기에 사용한다. */
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
          placeholder: "이미지를 첨부해주세요",
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
        accept="image/*"
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
