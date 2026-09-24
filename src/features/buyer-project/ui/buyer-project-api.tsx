"use client";
import Image from "next/image";
import { Fragment, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import { useSearchParams, useRouter } from "next/navigation";
import {
  getPublicProject,
  getPublicRewards,
  getRefundPolicy,
  getLiveVerifications,
  getPublicCommunity,
} from "@/entities/project/api/buyer-project-api";
import { getPublicNotices } from "@/entities/project/api/buyer-project-api";
import { Button } from "@/shared/components/ui/button";
import { ErrorState, toErrorStatus } from "@/shared/components/ui/error-state";
import { QueryErrorState } from "@/shared/components/ui/query-error-state";
import { BuyerProjectDetail } from "./buyer-project-detail";
import { RewardSummary } from "./reward-summary";
import { FundingCta } from "@/features/reward-selection/ui/funding-cta";
import { NoticeDetail } from "@/features/project-community/ui/notice-detail";
import {
  safeStoryHtml,
  isStoryHtml,
  type SafeStoryHtmlNode,
} from "@/features/project-story/model/story-content";

function renderStoryHtml(nodes: SafeStoryHtmlNode[], keyPrefix = "story"): ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${keyPrefix}-${index}`;
    if (typeof node === "string") return <Fragment key={key}>{node}</Fragment>;
    const children = renderStoryHtml(node.children, key);
    const style = node.style
      ? {
          color: node.style.color,
          textAlign: node.style.textAlign,
          fontWeight: node.style.fontWeight,
        }
      : undefined;
    if (node.tag === "br") return <br key={key} />;
    if (node.tag === "strong" || node.tag === "b")
      return (
        <strong key={key} style={style}>
          {children}
        </strong>
      );
    if (node.tag === "em" || node.tag === "i")
      return (
        <em key={key} style={style}>
          {children}
        </em>
      );
    if (node.tag === "u")
      return (
        <u key={key} style={style}>
          {children}
        </u>
      );
    if (node.tag === "span")
      return (
        <span key={key} style={style}>
          {children}
        </span>
      );
    if (node.tag === "p")
      return (
        <p key={key} style={style}>
          {children.length ? children : <br />}
        </p>
      );
    if (node.tag === "div")
      return (
        <div key={key} style={style}>
          {children}
        </div>
      );
    if (node.tag === "ul" || node.tag === "ol") {
      const List = node.tag;
      return (
        <List
          key={key}
          style={style}
          className={node.tag === "ul" ? "list-disc pl-5" : "list-decimal pl-5"}
        >
          {children}
        </List>
      );
    }
    if (node.tag === "li")
      return (
        <li key={key} style={style}>
          {children}
        </li>
      );
    return null;
  });
}

/* 리워드·환불·라이브 등 무관한 쿼리가 갱신될 때마다 정규식 토크나이저를 다시 돌리지 않도록
   블록 단위 컴포넌트로 분리해 값이 그대로면 파싱 결과를 재사용한다. */
function StoryTextBlock({ value }: { value: string }) {
  const story = useMemo(() => ({ html: isStoryHtml(value), nodes: safeStoryHtml(value) }), [value]);
  return (
    <div className={story.html ? "space-y-4" : "whitespace-pre-wrap"}>
      {renderStoryHtml(story.nodes)}
    </div>
  );
}

export function BuyerProjectApi({ projectId, tab }: { projectId: string; tab: string }) {
  const { state } = useAuth();
  const [expandedNoticeId, setExpandedNoticeId] = useState<number | null>(null);
  const params = useSearchParams(),
    router = useRouter();
  const raw = Number(params.get("page") ?? 1),
    page = Number.isSafeInteger(raw) && raw > 0 ? raw - 1 : 0;
  const detail = useQuery({
    queryKey: ["public-project", projectId],
    queryFn: ({ signal }) => getPublicProject(projectId, signal),
    enabled: state.status !== "checking",
  });
  const rewards = useQuery({
    queryKey: ["public-rewards", projectId],
    queryFn: ({ signal }) => getPublicRewards(projectId, signal),
    enabled: detail.isSuccess,
  });
  const refund = useQuery({
    queryKey: ["public-refund-policy", projectId],
    queryFn: ({ signal }) => getRefundPolicy(projectId, signal),
    enabled: detail.isSuccess && tab === "refund-policy",
  });
  const live = useQuery({
    queryKey: ["public-live-verifications", projectId],
    queryFn: ({ signal }) => getLiveVerifications(projectId, signal),
    enabled: detail.isSuccess && tab === "live-proof",
  });
  const notices = useQuery({
    queryKey: ["project-notices", projectId, page],
    queryFn: ({ signal }) => getPublicNotices(projectId, page, signal),
    enabled: detail.isSuccess && tab === "news",
  });
  const posts = useQuery({
    queryKey: ["public-community", projectId, page],
    queryFn: ({ signal }) => getPublicCommunity(projectId, page, signal),
    enabled: detail.isSuccess && tab === "community",
  });
  if (detail.isPending) return <p role="status">프로젝트를 불러오고 있습니다.</p>;
  if (detail.isError)
    return (
      <ErrorState
        status={toErrorStatus(detail.error)}
        action={{ label: "다시 시도", onClick: () => void detail.refetch() }}
      />
    );
  const data = detail.data,
    summary = data.fundingStatus;
  const active =
    tab === "refund-policy"
      ? refund
      : tab === "live-proof"
        ? live
        : tab === "news"
          ? notices
          : tab === "community"
            ? posts
            : null;
  const content = active?.isPending ? (
    <p role="status">불러오는 중입니다.</p>
  ) : active?.isError ? (
    <QueryErrorState
      variant="section"
      error={active.error}
      description="탭 콘텐츠를 불러오지 못했습니다."
      onRetry={() => void active.refetch()}
    />
  ) : tab === "story" ? (
    <div className="space-y-4">
      {data.introContent.map((block, index) =>
        block.type === "TEXT" ? (
          <StoryTextBlock key={index} value={block.value} />
        ) : block.type === "IMAGE" && /^https?:\/\//.test(block.value) ? (
          <Image
            unoptimized
            width={792}
            height={500}
            className="h-auto w-full"
            key={index}
            src={block.value}
            alt="프로젝트 소개"
          />
        ) : block.type === "VIDEO_URL" && /^https?:\/\//.test(block.value) ? (
          <a
            key={index}
            href={block.value}
            target="_blank"
            rel="noopener noreferrer"
            className="block underline"
          >
            소개 영상 보기
          </a>
        ) : (
          <p key={index}>표시할 수 없는 콘텐츠입니다.</p>
        ),
      )}
    </div>
  ) : tab === "refund-policy" ? (
    <div className="space-y-3">
      <p>간편환불 기한. {refund.data?.commonPolicy.simpleRefundDeadline}</p>
      <p>
        목표 미달 자동 환불. {refund.data?.commonPolicy.goalFailedAutoRefund ? "적용" : "미적용"}
      </p>
      {refund.data?.rewardPolicies?.map((item) => (
        <p key={item.rewardId}>
          리워드 {item.rewardId}. 간편환불 {item.simpleRefundDisabled ? "불가" : "가능"}
        </p>
      ))}
    </div>
  ) : tab === "live-proof" ? (
    <>
      <p className="mb-3">LIVE 검증 정보입니다. 영상 송출 연결은 준비 중입니다.</p>
      {/* Figma LIVE Q&A 카드(1408:42965). BE가 날짜를 주지 않아 "N건 · 날짜"는 건수만 적는다.
          질문 요약을 받기 전에 등록된 항목은 문구가 없어 답변만 보인다. */}
      <div className="flex flex-col gap-6">
        {live.data?.content?.map((item) => (
          <article key={item.liveVerificationId} className="flex flex-col gap-2">
            {item.questionText && (
              <div>
                <h3 className="text-body-strong">{item.questionText}</h3>
                <p className="text-caption-s text-text-secondary">{item.questionCount}건</p>
              </div>
            )}
            <div className="border-border-default text-body-s flex flex-col gap-1 rounded-xs border px-3 py-2 font-medium">
              <p className="whitespace-pre-wrap">{item.answer}</p>
              <p className="text-caption-s text-text-secondary">판매자</p>
            </div>
          </article>
        ))}
      </div>
      {!live.data?.content?.length && <p>등록된 검증 정보가 없습니다.</p>}
    </>
  ) : tab === "news" ? (
    <>
      {notices.data?.content?.map((item) => (
        <article key={item.noticeId} className="border-border-default border-b py-3">
          <h2 className="text-title-s">{item.title}</h2>
          <Button
            variant="secondary"
            onClick={() =>
              setExpandedNoticeId((current) => (current === item.noticeId ? null : item.noticeId))
            }
            aria-expanded={expandedNoticeId === item.noticeId}
          >
            본문 보기
          </Button>
          {expandedNoticeId === item.noticeId && <NoticeDetail noticeId={item.noticeId} />}
        </article>
      ))}
      {!notices.data?.content?.length && <p>새 소식이 없습니다.</p>}
    </>
  ) : tab === "community" ? (
    <>
      {posts.data?.content?.map((item) => (
        <article className="border-border-default border-b py-3" key={item.postId}>
          <p className="whitespace-pre-wrap">{item.content}</p>
          {item.answer && (
            <p className="bg-layer-bg mt-3 p-3 whitespace-pre-wrap">
              판매자 답변. {item.answer.content}
            </p>
          )}
        </article>
      ))}
      {!posts.data?.content?.length && <p>게시글이 없습니다.</p>}
    </>
  ) : (
    <p>이 정보는 아직 조회할 수 없습니다.</p>
  );
  const paged = tab === "news" ? notices.data : tab === "community" ? posts.data : undefined;
  const rewardContent = (
    <RewardSummary
      rewards={rewards.data}
      isPending={rewards.isPending}
      isError={rewards.isError}
      onRetry={() => void rewards.refetch()}
    />
  );
  return (
    <BuyerProjectDetail
      projectId={projectId}
      activeTab={tab}
      hasLive={false}
      server={summary}
      project={{
        title: data.title,
        seller: data.seller?.displayName ?? "",
        image: data.coverImageUrl ?? "",
        poster: "",
        rate: summary.achievementRate.toLocaleString("ko-KR"),
        amount: summary.currentAmount.toLocaleString("ko-KR"),
        goal: data.goalAmount?.toLocaleString("ko-KR") ?? "—",
      }}
      fundingAction={
        data.status === "ONGOING" ? (
          <FundingCta projectId={projectId} />
        ) : (
          <Button disabled>현재 펀딩에 참여할 수 없습니다</Button>
        )
      }
      tabContent={
        <>
          {content}
          {tab === "story" && <div className="min-[1200px]:hidden">{rewardContent}</div>}
          {paged && (
            <div className="mt-4 flex justify-between">
              <Button
                disabled={page === 0}
                onClick={() => router.push(`/projects/${projectId}?tab=${tab}&page=${page}`)}
              >
                이전 페이지
              </Button>
              <Button
                disabled={!paged.hasNext}
                onClick={() => router.push(`/projects/${projectId}?tab=${tab}&page=${page + 2}`)}
              >
                다음 페이지
              </Button>
            </div>
          )}
        </>
      }
      rewardSummary={rewardContent}
    />
  );
}
