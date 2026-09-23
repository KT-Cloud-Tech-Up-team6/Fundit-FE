"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getManagementProject,
  getNoticeDetail,
} from "@/entities/project/api/project-management-api";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/shared/components/ui/button";
import { QueryErrorState } from "@/shared/components/ui/query-error-state";
import { NoticeEditor } from "./notice-editor";

export function NoticeDetail({ noticeId, projectId }: { noticeId: number; projectId?: string }) {
  const { state } = useAuth();
  const cache = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const detailKey = ["notice-detail", projectId ? "seller" : "public", noticeId] as const;
  const owner = useQuery({
    queryKey: ["seller-project-preview", state.user?.memberId, projectId],
    queryFn: ({ signal }) => getManagementProject(projectId!, signal),
    enabled:
      Boolean(projectId) && state.status === "authenticated" && Boolean(state.user?.memberId),
    retry: false,
  });
  const detail = useQuery({
    queryKey: detailKey,
    queryFn: ({ signal }) => getNoticeDetail(noticeId, signal, Boolean(projectId)),
  });
  if (detail.isPending) return <p role="status">본문을 불러오고 있습니다.</p>;
  if (detail.isError)
    return (
      <QueryErrorState
        variant="section"
        error={detail.error}
        description="본문을 불러오지 못했습니다."
        onRetry={() => void detail.refetch()}
      />
    );
  if (projectId && editing && owner.isSuccess && state.status === "authenticated")
    return (
      <NoticeEditor
        notice={detail.data}
        onCancel={() => setEditing(false)}
        onSaved={(notice) => {
          cache.setQueryData(detailKey, notice);
          void cache.invalidateQueries({ queryKey: ["seller-project-notices", projectId] });
          void cache.invalidateQueries({ queryKey: detailKey });
          setEditing(false);
          setSaved(true);
        }}
      />
    );
  return (
    <div className="mt-3 space-y-3">
      <p className="whitespace-pre-wrap">{detail.data.content}</p>
      {saved && <p role="status">새 소식을 수정했습니다.</p>}
      {projectId && owner.isSuccess && state.status === "authenticated" && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setSaved(false);
            setEditing(true);
          }}
        >
          새 소식 수정
        </Button>
      )}
    </div>
  );
}
