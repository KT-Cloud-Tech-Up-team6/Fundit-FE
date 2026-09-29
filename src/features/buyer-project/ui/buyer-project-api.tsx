"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import { useSearchParams, useRouter } from "next/navigation";
import {
  getPublicProject,
  getRefundPolicy,
  getLiveVerifications,
  getPublicCommunity,
} from "@/entities/project/api/buyer-project-api";
import { getPublicNotices } from "@/entities/project/api/buyer-project-api";
import { Button } from "@/shared/components/ui/button";
import { ErrorState, toErrorStatus } from "@/shared/components/ui/error-state";
import { QueryErrorState } from "@/shared/components/ui/query-error-state";
import { previousPage } from "@/shared/lib/previous-page";
import {
  BuyerProjectDetail,
  DetailIcon,
  Information,
  LiveReplaySection,
  VideoList,
} from "./buyer-project-detail";
import styles from "./buyer-project-detail.module.css";
import { RewardSummary } from "./reward-summary";
import { FundingCta } from "@/features/reward-selection/ui/funding-cta";
import { RewardSheet } from "@/features/reward-selection/ui/reward-sheet";
import {
  publicRewardsQuery,
  toOrderLines,
  toRewards,
} from "@/features/reward-selection/model/public-reward";
import type { RewardCart } from "@/features/reward-selection/model/reward-demo";
import { NoticeDetail } from "@/features/project-community/ui/notice-detail";
import { getPublicLives } from "@/entities/live/api/public-live-api";
import { getPublicProjectClips } from "@/features/live-integration/api/live-api";
import { clipVideo, endedLiveVideo } from "../model/live-replay";
import { StoryTextBlock } from "@/features/project-story/ui/story-html";

/* LIVE 다시 보기 목록마다 불러오는 중·오류·빈 목록을 따로 보인다(#319, 원본에 상태 없음). 불러오는 중과 빈 목록
   안내는 같은 자리의 `<p>`라 역할을 같게 두어 빈 목록으로 바뀐 것도 알린다. */
function videoListState(
  query: UseQueryResult<{ content: readonly unknown[] }>,
  messages: { loading: string; error: string; empty: string },
) {
  if (query.isPending)
    return (
      <p role="status" className="text-body-s text-text-secondary py-6 text-center">
        {messages.loading}
      </p>
    );
  if (query.isError)
    return (
      <QueryErrorState
        variant="section"
        error={query.error}
        description={messages.error}
        onRetry={() => void query.refetch()}
      />
    );
  if (!query.data.content.length)
    return (
      <p role="status" className="text-body-s text-text-secondary py-6 text-center">
        {messages.empty}
      </p>
    );
  return undefined;
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
  const rewards = useQuery({ ...publicRewardsQuery(projectId), enabled: detail.isSuccess });
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
  /* LIVE 체크 탭 "LIVE 다시 보기"(#319). 종료된 라이브는 항상 공개(2026-09-23 PM)이고, 숏 클립은 판매자가 LIVE
     클립 관리에서 공개한 것만 온다. 두 목록 모두 비인증이고 첫 페이지(20건)만 받는다.
     종료된 라이브는 LIVE 체크 탭을 보일지 정하는 데도 써서 어느 탭에서든 받는다(#456). */
  const endedLives = useQuery({
    queryKey: ["public-lives", { status: "ENDED", projectId }],
    queryFn: ({ signal }) => getPublicLives({ status: "ENDED", projectId }, signal),
    enabled: detail.isSuccess,
  });
  /* IA 소비자 26행: LIVE 방송을 진행한 프로젝트만 LIVE 체크 탭을 보인다. 종료된 LIVE가 없다고 서버가 확인했을
     때만 숨기고, 불러오는 중·실패에는 그대로 둔다. 숨긴 탭 주소로 들어오면 기본 탭으로 바꾼다(자체 판단 133). */
  const liveCheckHidden = endedLives.data?.totalElements === 0;
  useEffect(() => {
    if (liveCheckHidden && tab === "live-proof")
      router.replace(`/projects/${encodeURIComponent(projectId)}?tab=story`, { scroll: false });
  }, [liveCheckHidden, tab, projectId, router]);
  const clips = useQuery({
    queryKey: ["public-project-clips", projectId],
    queryFn: ({ signal }) => getPublicProjectClips(projectId, signal),
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
  /* 환불정책 탭은 리워드 이름도 리워드 목록에서 찾는다. 목록을 받기 전이나 처음 받기에 실패하면 모든 행이
     "리워드"로 보여 구별할 수 없으므로 두 조회를 함께 기다리고 함께 다시 시도한다(#405). 이름을 이미 받은 뒤의
     재조회 실패(`isError`)로는 탭을 오류로 바꾸지 않는다. */
  const refundTab = {
    isPending: refund.isPending || rewards.isPending,
    isError: refund.isError || rewards.isLoadingError,
    error: refund.error ?? rewards.error,
    refetch: () => Promise.all([refund.refetch(), rewards.refetch()]),
  };
  /* LIVE 체크 탭은 탭 단위로 막지 않는다. LIVE 다시 보기 두 목록과 LIVE Q&A가 각자 불러오는 중·오류를 보여
     한쪽이 늦거나 실패해도 나머지는 보인다(#319). */
  const active =
    tab === "refund-policy"
      ? refundTab
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
      {/* 환불 정책 응답에는 리워드 id만 있다. 내부 id 대신 리워드 목록의 이름을 보인다(#405). */}
      {refund.data?.rewardPolicies?.map((item) => (
        <p key={item.rewardId}>
          {rewards.data?.find((reward) => reward.rewardId === item.rewardId)?.name ?? "리워드"}.
          간편환불 {item.simpleRefundDisabled ? "불가" : "가능"}
        </p>
      ))}
    </div>
  ) : tab === "live-proof" ? (
    <>
      {/* Figma LIVE 체크 탭(FL_B_PJ_LIVE 1541:50459)은 "LIVE 다시 보기"(1541:50492) 아래 LIVE Q&A다(간격 24px). */}
      <LiveReplaySection
        className="mb-6"
        count={
          endedLives.data && clips.data
            ? endedLives.data.totalElements + clips.data.totalElements
            : undefined
        }
      >
        <VideoList
          title="종료된 라이브"
          count={endedLives.data?.totalElements}
          videos={endedLives.data?.content.map(endedLiveVideo) ?? []}
          state={videoListState(endedLives, {
            loading: "종료된 라이브를 불러오고 있습니다.",
            error: "종료된 라이브를 불러오지 못했습니다.",
            empty: "종료된 라이브가 없습니다.",
          })}
        />
        <VideoList
          title="숏 클립"
          count={clips.data?.totalElements}
          videos={clips.data?.content.map(clipVideo) ?? []}
          state={videoListState(clips, {
            loading: "숏 클립을 불러오고 있습니다.",
            error: "숏 클립을 불러오지 못했습니다.",
            empty: "공개된 숏 클립이 없습니다.",
          })}
        />
      </LiveReplaySection>
      {/* "LIVE Q&A N건 ⓘ" 머리 행이다(질문 아이콘 1541:50564, 정보 아이콘·툴팁 1541:50567·1541:50704).
          원본에 없던 안내 문장은 뺐다(#405). */}
      <div className="mb-3 flex items-center gap-1">
        {/* Figma는 아이콘·제목 사이 8px(1541:50563), 제목·건수·안내 아이콘 사이 4px(1541:50562)다. */}
        <h2 className="text-title-s flex items-center gap-1">
          <span className="flex items-center gap-2">
            <DetailIcon name="question-filled" className="text-text-primary-live size-5" />
            LIVE Q&amp;A
          </span>{" "}
          {live.data && (
            <small className="text-caption-s text-text-secondary font-medium">
              {live.data.content?.length ?? 0}건
            </small>
          )}
        </h2>
        <Information label="LIVE Q&A 안내" />
      </div>
      {/* Figma LIVE Q&A 카드(1408:42965). BE가 날짜를 주지 않아 "N건 · 날짜"는 건수만 적는다.
          질문 요약을 받기 전에 등록된 항목은 문구가 없어 답변만 보인다. */}
      {live.isPending ? (
        <p role="status">LIVE Q&amp;A를 불러오고 있습니다.</p>
      ) : live.isError ? (
        <QueryErrorState
          variant="section"
          error={live.error}
          description="LIVE Q&A를 불러오지 못했습니다."
          onRetry={() => void live.refetch()}
        />
      ) : live.data.content?.length ? (
        <div className="flex flex-col gap-6">
          {live.data.content.map((item) => (
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
      ) : (
        <p role="status">등록된 LIVE Q&amp;A가 없습니다.</p>
      )}
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
  /* 진행 중이고 리워드를 받았을 때만 Figma 리워드 선택(웹 인라인·모바일 시트)을 연다. 그 밖에는
     기존 요약(불러오는 중·오류 재시도·종료)을 둔다. 담은 줄은 기존 실제 주문서 계약(items 쿼리)으로
     넘기고, 로그인 확인은 주문서의 회원 게이트가 맡는다. */
  const rewardList =
    data.status === "ONGOING" && rewards.data ? toRewards(rewards.data) : undefined;
  const rewardFormId = `rewards-${projectId}`;
  function toCheckout(cart: RewardCart) {
    if (!rewardList) return;
    const items = JSON.stringify(toOrderLines(rewardList, cart));
    router.push(`/funding/${projectId}/checkout?${new URLSearchParams({ items })}`);
  }
  return (
    <BuyerProjectDetail
      projectId={projectId}
      activeTab={tab}
      hasLive={false}
      liveCheckTab={!liveCheckHidden}
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
        data.status !== "ONGOING" ? (
          <Button disabled>현재 펀딩에 참여할 수 없습니다</Button>
        ) : rewardList ? (
          <FundingCta
            projectId={projectId}
            className={styles.funding}
            desktopFormId={rewardFormId}
            rewards={rewardList}
            onSubmit={toCheckout}
          />
        ) : (
          <Button className={styles.funding} disabled>
            펀딩하기
          </Button>
        )
      }
      rewardSelection={
        rewardList && (
          <RewardSheet
            projectId={projectId}
            inlineFormId={rewardFormId}
            rewards={rewardList}
            onSubmit={toCheckout}
          />
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
                onClick={() =>
                  router.push(
                    `/projects/${projectId}?tab=${tab}&page=${previousPage(page + 1, paged)}`,
                  )
                }
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
