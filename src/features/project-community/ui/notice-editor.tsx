"use client";

import { useRef, useState } from "react";
import { updateNotice, type NoticeDetail } from "@/entities/project/api/project-management-api";
import { ApiError } from "@/shared/api/api-error";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";

export function NoticeEditor({
  notice,
  onSaved,
  onCancel,
}: {
  notice: NoticeDetail;
  onSaved: (notice: NoticeDetail) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(notice.title);
  const [content, setContent] = useState(notice.content);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  return (
    <form
      aria-label="새 소식 수정"
      className="space-y-3"
      onSubmit={async (event) => {
        event.preventDefault();
        if (pending.current) return;
        if (!title.trim() || title.trim().length > 100 || !content.trim()) {
          setError("제목은 1~100자, 본문은 빈 내용 없이 입력해주세요.");
          return;
        }
        const body = {
          ...(title.trim() === notice.title ? {} : { title: title.trim() }),
          ...(content === notice.content ? {} : { content }),
        };
        if (!Object.keys(body).length) {
          onCancel();
          return;
        }
        pending.current = true;
        setBusy(true);
        setError("");
        try {
          onSaved(await updateNotice(notice.noticeId, body));
        } catch (cause) {
          setError(
            cause instanceof ApiError && cause.status === 403
              ? "수정 권한이 없습니다. 입력 내용은 유지됩니다."
              : cause instanceof ApiError && cause.status === 404
                ? "새 소식을 찾을 수 없습니다. 입력 내용은 유지됩니다."
                : "저장하지 못했습니다. 입력 내용을 유지했으니 다시 시도해주세요.",
          );
        } finally {
          pending.current = false;
          setBusy(false);
        }
      }}
    >
      <fieldset disabled={busy} className="space-y-3">
        <label className="block space-y-1">
          <span>제목</span>
          <Input
            aria-label="수정 제목"
            maxLength={100}
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setError("");
            }}
          />
        </label>
        <label className="block space-y-1">
          <span>본문</span>
          <Textarea
            aria-label="수정 본문"
            value={content}
            onChange={(event) => {
              setContent(event.target.value);
              setError("");
            }}
          />
        </label>
        <p className="text-caption-s">새 소식 유형은 변경할 수 없습니다.</p>
        {error && <p role="alert">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" size="sm">
            {busy ? "저장 중" : "수정 저장"}
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
            취소
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
