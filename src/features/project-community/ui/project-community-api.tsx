"use client";

import { useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import {
  answerCommunityPost,
  createNotice,
  createNoticeComment,
  getCommunityPosts,
  getNotices,
  getNoticeComments,
  noticeTypes,
} from "@/entities/project/api/project-management-api";
import { NoticeDetail } from "./notice-detail";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";

function ContentForm({
  initial = "",
  label,
  onSubmit,
  maxLength,
  validationError = "",
  children,
}: {
  initial?: string;
  label: string;
  onSubmit: (content: string) => Promise<unknown>;
  maxLength?: number;
  validationError?: string;
  children?: ReactNode;
}) {
  const [content, setContent] = useState(initial);
  const [showValidation, setShowValidation] = useState(false);
  const pending = useRef(false);
  const mutation = useMutation({
    mutationFn: () => onSubmit(content.trim()),
    onSuccess: () => {
      setContent("");
      setShowValidation(false);
    },
    onSettled: () => {
      pending.current = false;
    },
  });
  return (
    <form
      className="mt-3 space-y-2"
      onChange={() => setShowValidation(true)}
      onSubmit={(event) => {
        event.preventDefault();
        setShowValidation(true);
        if (content.trim() && !validationError && !pending.current) {
          pending.current = true;
          mutation.mutate();
        }
      }}
    >
      {children}
      <Textarea
        aria-label={label}
        value={content}
        maxLength={maxLength}
        disabled={mutation.isPending}
        onChange={(event) => setContent(event.target.value)}
      />
      {showValidation && validationError && <p role="alert">{validationError}</p>}
      <Button
        type="submit"
        disabled={!content.trim() || Boolean(validationError) || mutation.isPending}
      >
        {label}
      </Button>
      {mutation.isError && (
        <p role="alert">등록하지 못했습니다. 입력 내용을 확인하고 다시 시도해주세요.</p>
      )}
      {mutation.isSuccess && <p role="status">등록했습니다.</p>}
    </form>
  );
}

function PageButtons({
  page,
  hasNext,
  onChange,
}: {
  page: number;
  hasNext: boolean;
  onChange: (page: number) => void;
}) {
  return (
    <div className="mt-4 flex gap-3">
      <Button variant="secondary" disabled={page === 0} onClick={() => onChange(page - 1)}>
        이전 페이지
      </Button>
      <span>{page + 1} 페이지</span>
      <Button variant="secondary" disabled={!hasNext} onClick={() => onChange(page + 1)}>
        다음 페이지
      </Button>
    </div>
  );
}

function NoticeComments({ noticeId }: { noticeId: number }) {
  const [page, setPage] = useState(0);
  const cache = useQueryClient();
  const { state } = useAuth();
  const key = ["notice-comments", noticeId];
  const query = useQuery({
    queryKey: [...key, page],
    queryFn: ({ signal }) => getNoticeComments(noticeId, page, signal),
  });
  return (
    <div className="mt-3">
      {query.isPending ? (
        <p role="status">댓글을 불러오고 있습니다.</p>
      ) : query.isError ? (
        <p role="alert">
          댓글 조회 실패.{" "}
          <button type="button" onClick={() => void query.refetch()}>
            다시 시도
          </button>
        </p>
      ) : (
        <>
          <ul>
            {query.data.content.map((comment) => (
              <li
                className="border-border-default border-b py-3 whitespace-pre-wrap"
                key={comment.commentId}
              >
                {comment.content}
              </li>
            ))}
          </ul>
          {!query.data.content.length && <p>댓글이 없습니다.</p>}
          <PageButtons page={page} hasNext={query.data.hasNext} onChange={setPage} />
        </>
      )}
      {state.status === "authenticated" && (
        <ContentForm
          label="댓글 등록"
          maxLength={500}
          onSubmit={async (content) => {
            await createNoticeComment(noticeId, content);
            setPage(0);
            await cache.invalidateQueries({ queryKey: key });
          }}
        />
      )}
    </div>
  );
}

export function ProjectCommunityApi({
  projectId,
  tab,
}: {
  projectId: string;
  tab: "news" | "community";
}) {
  const { state } = useAuth();
  const cache = useQueryClient();
  const router = useRouter();
  const search = useSearchParams();
  const rawPage = Number(search.get("page") ?? 1);
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage - 1 : 0;
  const postType = ["QUESTION", "CHEER"].includes(search.get("postType") ?? "")
    ? search.get("postType")!
    : "";
  const answeredOnly = search.get("answeredOnly") === "true";
  function navigate(next: Record<string, string>) {
    const params = new URLSearchParams(search.toString());
    for (const [key, value] of Object.entries(next)) params.set(key, value);
    router.push(`/seller/projects/${projectId}?${params}`);
  }
  const postsKey = ["project-community", state.user?.memberId, projectId];
  const noticesKey = ["project-notices", projectId];
  const posts = useQuery({
    queryKey: [...postsKey, page, postType, answeredOnly],
    queryFn: ({ signal }) => getCommunityPosts(projectId, page, postType, answeredOnly, signal),
    enabled: tab === "community",
  });
  const notices = useQuery({
    queryKey: [...noticesKey, page],
    queryFn: ({ signal }) => getNotices(projectId, page, signal),
    enabled: tab === "news",
  });
  const [noticeType, setNoticeType] = useState("REWARD_INFO");
  const [title, setTitle] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  return (
    <section className="max-w-198 space-y-4">
      <h1 className="text-heading-l">{tab === "news" ? "새 소식" : "커뮤니티"}</h1>
      {tab === "community" ? (
        <>
          <div className="flex gap-3">
            <label>
              글 유형{" "}
              <select
                aria-label="글 유형"
                value={postType}
                onChange={(event) => navigate({ postType: event.target.value, page: "1" })}
              >
                <option value="">전체</option>
                <option value="QUESTION">문의</option>
                <option value="CHEER">응원</option>
              </select>
            </label>
            <label>
              <input
                type="checkbox"
                checked={answeredOnly}
                onChange={(event) =>
                  navigate({ answeredOnly: String(event.target.checked), page: "1" })
                }
              />{" "}
              답변 완료만
            </label>
          </div>
          {posts.isPending ? (
            <p role="status">게시글을 불러오고 있습니다.</p>
          ) : posts.isError ? (
            <p role="alert">
              게시글 조회 실패.{" "}
              <button type="button" onClick={() => void posts.refetch()}>
                다시 시도
              </button>
            </p>
          ) : (
            <>
              {!posts.data.content.length && <p>게시글이 없습니다.</p>}
              {posts.data.content.map((post) => (
                <article key={post.postId} className="border-border-default rounded-xs border p-4">
                  <p className="whitespace-pre-wrap">{post.content}</p>
                  {post.answer && (
                    <p className="bg-layer-bg mt-2 p-3 whitespace-pre-wrap">
                      판매자 답변. {post.answer.content}
                    </p>
                  )}
                  <ContentForm
                    key={`${post.postId}-${post.answer?.updatedAt ?? "new"}`}
                    initial={post.answer?.content}
                    label="답변 등록"
                    onSubmit={async (content) => {
                      await answerCommunityPost(post.postId, content);
                      await cache.invalidateQueries({ queryKey: postsKey });
                    }}
                  />
                </article>
              ))}
              <PageButtons
                page={page}
                hasNext={posts.data.hasNext}
                onChange={(next) => navigate({ page: String(next + 1) })}
              />
            </>
          )}
        </>
      ) : (
        <>
          {notices.isPending ? (
            <p role="status">새 소식을 불러오고 있습니다.</p>
          ) : notices.isError ? (
            <p role="alert">
              새 소식 조회 실패.{" "}
              <button type="button" onClick={() => void notices.refetch()}>
                다시 시도
              </button>
            </p>
          ) : (
            <>
              {!notices.data.content.length && <p>새 소식이 없습니다.</p>}
              {notices.data.content.map((notice) => (
                <article
                  key={notice.noticeId}
                  className="border-border-default rounded-xs border p-4"
                >
                  <h2 className="text-title-s">{notice.title}</h2>
                  <p className="text-caption-s">
                    {noticeTypes[notice.noticeType as keyof typeof noticeTypes] ??
                      notice.noticeType}
                  </p>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setExpanded(expanded === notice.noticeId ? null : notice.noticeId)
                    }
                    aria-expanded={expanded === notice.noticeId}
                  >
                    본문·댓글 보기
                  </Button>
                  {expanded === notice.noticeId && (
                    <>
                      <NoticeDetail
                        key={`${state.user?.memberId}:${notice.noticeId}`}
                        noticeId={notice.noticeId}
                        projectId={projectId}
                      />
                      <NoticeComments noticeId={notice.noticeId} />
                    </>
                  )}
                </article>
              ))}
              <PageButtons
                page={page}
                hasNext={notices.data.hasNext}
                onChange={(next) => navigate({ page: String(next + 1) })}
              />
            </>
          )}
          <div className="border-border-default rounded-xs border p-4">
            <h2 className="text-title-s">새 소식 작성</h2>
            <ContentForm
              label="새 소식 등록"
              validationError={title.trim() ? "" : "새 소식 제목을 입력해주세요."}
              onSubmit={async (content) => {
                await createNotice(projectId, { noticeType, title: title.trim(), content });
                setTitle("");
                navigate({ page: "1" });
                await cache.invalidateQueries({ queryKey: noticesKey });
              }}
            >
              <label>
                유형{" "}
                <select value={noticeType} onChange={(event) => setNoticeType(event.target.value)}>
                  {Object.entries(noticeTypes).map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <Input
                aria-label="새 소식 제목"
                maxLength={100}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </ContentForm>
          </div>
        </>
      )}
    </section>
  );
}
