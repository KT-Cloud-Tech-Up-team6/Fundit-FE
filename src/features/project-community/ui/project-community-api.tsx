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
import { formatNoticeDate } from "../model/notice-date";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { FormField } from "@/shared/components/ui/form-field";
import { Input } from "@/shared/components/ui/input";
import { Pagination } from "@/shared/components/ui/pagination";
import { Select } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { ProjectPageHeader } from "@/entities/project/ui/project-sidebar";

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

function NoticeComposer({
  projectId,
  onCreated,
}: {
  projectId: string;
  onCreated: () => Promise<void>;
}) {
  const [noticeType, setNoticeType] = useState("REWARD_INFO");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [touched, setTouched] = useState({ title: false, content: false });
  const mutation = useMutation({
    mutationFn: () =>
      createNotice(projectId, {
        noticeType,
        title: title.trim(),
        content: content.trim(),
      }),
    onSuccess: async () => {
      setTitle("");
      setContent("");
      setTouched({ title: false, content: false });
      await onCreated();
    },
  });
  const titleError = touched.title && !title.trim();
  const contentError = touched.content && !content.trim();
  const valid = Boolean(title.trim() && content.trim());

  return (
    <section className="border-w-xs border-border-default overflow-hidden rounded-xs">
      <header className="bg-layer-bg border-border-default border-b px-4 py-3">
        <h2 className="text-title-s">새 소식 작성</h2>
        <p className="text-caption-s text-text-secondary mt-1">
          프로젝트 진행 상황과 후원자에게 필요한 안내를 등록해주세요.
        </p>
      </header>
      <form
        className="space-y-4 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          setTouched({ title: true, content: true });
          if (valid && !mutation.isPending) mutation.mutate();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-[220px_minmax(0,1fr)]">
          <FormField htmlFor="notice-type" label="유형">
            <Select
              id="notice-type"
              size="md"
              value={noticeType}
              disabled={mutation.isPending}
              onChange={(event) => setNoticeType(event.target.value)}
            >
              {Object.entries(noticeTypes).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField
            htmlFor="notice-title"
            label="제목"
            errorMessage={titleError ? "새 소식 제목을 입력해주세요." : undefined}
          >
            <Input
              id="notice-title"
              maxLength={100}
              placeholder="제목을 입력해주세요"
              value={title}
              disabled={mutation.isPending}
              error={titleError}
              aria-describedby={titleError ? "notice-title-error" : undefined}
              onChange={(event) => setTitle(event.target.value)}
              onBlur={() => setTouched((current) => ({ ...current, title: true }))}
            />
          </FormField>
        </div>
        <FormField
          htmlFor="notice-content"
          label="내용"
          errorMessage={contentError ? "새 소식 내용을 입력해주세요." : undefined}
        >
          <Textarea
            id="notice-content"
            aria-describedby={contentError ? "notice-content-error" : undefined}
            className="min-h-40"
            maxLength={3000}
            placeholder="후원자에게 전달할 내용을 입력해주세요"
            value={content}
            disabled={mutation.isPending}
            error={contentError}
            onChange={(event) => setContent(event.target.value)}
            onBlur={() => setTouched((current) => ({ ...current, content: true }))}
          />
        </FormField>
        <div className="flex flex-col items-end gap-2">
          <Button
            type="submit"
            appearance="cta"
            size="md"
            className="w-full sm:w-45"
            disabled={!valid || mutation.isPending}
          >
            {mutation.isPending ? "등록 중" : "새 소식 등록"}
          </Button>
          {mutation.isError && (
            <p role="alert" className="text-caption-s text-text-warning">
              새 소식을 등록하지 못했습니다. 입력 내용을 확인하고 다시 시도해주세요.
            </p>
          )}
          {mutation.isSuccess && (
            <p role="status" className="text-caption-s text-text-secondary">
              새 소식을 등록했습니다.
            </p>
          )}
        </div>
      </form>
    </section>
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
  const noticesKey = ["seller-project-notices", projectId];
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
  const noticeTotalElements =
    notices.data && Number.isFinite(notices.data.totalElements)
      ? Math.max(0, notices.data.totalElements)
      : (notices.data?.content.length ?? 0);
  const noticeTotalPages =
    notices.data && Number.isFinite(notices.data.totalPages) && notices.data.totalPages >= 1
      ? Math.floor(notices.data.totalPages)
      : notices.data?.hasNext
        ? page + 2
        : page + 1;
  const [expanded, setExpanded] = useState<number | null>(null);
  return (
    <section className="w-full max-w-198">
      <ProjectPageHeader
        breadcrumb={["내 프로젝트", tab === "news" ? "새 소식" : "커뮤니티 관리"]}
        title={tab === "news" ? "새 소식" : "커뮤니티"}
      />
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
        <div className="space-y-6">
          {notices.isPending ? (
            <p role="status" className="text-body-s text-text-secondary py-12 text-center">
              새 소식을 불러오고 있습니다.
            </p>
          ) : notices.isError ? (
            <div className="border-w-xs border-border-default flex flex-col items-center gap-3 rounded-xs py-10">
              <p role="alert" className="text-body-s text-text-secondary">
                새 소식을 불러오지 못했습니다.
              </p>
              <Button size="md" variant="secondary" onClick={() => void notices.refetch()}>
                다시 시도
              </Button>
            </div>
          ) : (
            <section aria-labelledby="notice-list-title">
              <div className="mb-2 flex items-center justify-between">
                <h2 id="notice-list-title" className="text-title-s">
                  등록된 새 소식
                </h2>
                <p className="text-caption-s text-text-secondary">
                  총 {noticeTotalElements.toLocaleString("ko-KR")}건
                </p>
              </div>
              <div className="border-w-xs border-border-default overflow-hidden rounded-xs">
                {!notices.data.content.length ? (
                  <div className="flex min-h-36 flex-col items-center justify-center gap-1 px-4 text-center">
                    <p className="text-body-strong">등록된 새 소식이 없습니다.</p>
                    <p className="text-caption-s text-text-secondary">
                      아래 작성 영역에서 첫 소식을 등록해보세요.
                    </p>
                  </div>
                ) : (
                  notices.data.content.map((notice) => {
                    const isExpanded = expanded === notice.noticeId;
                    return (
                      <article
                        key={notice.noticeId}
                        className="border-border-default border-b last:border-b-0"
                      >
                        <div className="flex items-center gap-4 px-4 py-3">
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <Badge size="sm" variant="neutral" shape="rounded">
                                {noticeTypes[notice.noticeType as keyof typeof noticeTypes] ??
                                  notice.noticeType}
                              </Badge>
                              <time
                                className="text-caption-s text-text-secondary"
                                dateTime={notice.createdAt}
                              >
                                {formatNoticeDate(notice.createdAt)}
                              </time>
                            </div>
                            <h3 className="text-body-strong truncate" title={notice.title}>
                              {notice.title}
                            </h3>
                          </div>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="shrink-0"
                            onClick={() => setExpanded(isExpanded ? null : notice.noticeId)}
                            aria-expanded={isExpanded}
                          >
                            {isExpanded ? "접기" : "내용 보기"}
                          </Button>
                        </div>
                        {isExpanded && (
                          <div className="bg-layer-bg border-border-default border-t px-4 py-3">
                            <NoticeDetail
                              key={`${state.user?.memberId}:${notice.noticeId}`}
                              noticeId={notice.noticeId}
                              projectId={projectId}
                            />
                            <NoticeComments noticeId={notice.noticeId} />
                          </div>
                        )}
                      </article>
                    );
                  })
                )}
              </div>
              <Pagination
                currentPage={page + 1}
                totalPages={noticeTotalPages}
                buildHref={(nextPage) => {
                  const params = new URLSearchParams(search.toString());
                  params.set("tab", "news");
                  params.set("page", String(nextPage));
                  return `/seller/projects/${projectId}?${params}`;
                }}
              />
            </section>
          )}
          <NoticeComposer
            projectId={projectId}
            onCreated={async () => {
              navigate({ page: "1" });
              await cache.invalidateQueries({ queryKey: noticesKey });
            }}
          />
        </div>
      )}
    </section>
  );
}
