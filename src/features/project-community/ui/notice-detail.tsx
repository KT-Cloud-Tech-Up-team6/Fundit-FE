"use client";

import { useQuery } from "@tanstack/react-query";
import { getNoticeDetail } from "@/entities/project/api/project-management-api";

export function NoticeDetail({ noticeId }: { noticeId: number }) {
  const detail = useQuery({
    queryKey: ["notice-detail", noticeId],
    queryFn: ({ signal }) => getNoticeDetail(noticeId, signal),
  });
  if (detail.isPending) return <p role="status">본문을 불러오고 있습니다.</p>;
  if (detail.isError)
    return (
      <p role="alert">
        본문 조회 실패. <button onClick={() => void detail.refetch()}>다시 시도</button>
      </p>
    );
  return <p className="mt-3 whitespace-pre-wrap">{detail.data.content}</p>;
}
