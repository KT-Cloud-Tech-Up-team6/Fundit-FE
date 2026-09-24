"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { getPublicProject } from "@/entities/project/api/buyer-project-api";
import {
  followSeller,
  followsQueryKey,
  getAllFollows,
  unfollowSeller,
} from "@/entities/seller/api/follow-api";
import { BuyerLiveDesktop } from "@/features/buyer-live-room/ui/buyer-live-desktop";
import { BuyerLiveReplay } from "@/features/buyer-live-replay/ui/buyer-live-replay";
import { BuyerLiveRoom } from "@/features/buyer-live-room/ui/buyer-live-room";
import { useAuth } from "@/providers/auth-provider";
import {
  getAnsweredQuestions,
  getLiveLiked,
  getPlayback,
  getPublicHighlights,
  getVod,
  getVodChat,
  likeLive,
  recordHighlightClick,
  unlikeLive,
  type LikeResult,
} from "../api/live-api";
import { LivePlayer, type LivePlayerHandle } from "./live-player";
import { QueryError } from "./query-error";
import {
  chapterRange,
  clipBadge,
  formatPlaybackTime,
  pickClip,
  toChapters,
} from "../model/vod-chapters";

function answeredByLabel(value: string) {
  return value === "AI" ? "AI 답변" : value === "SELLER" ? "판매자 답변" : "답변자 미확인";
}

type FollowOverride = { memberId: string; sellerId: string; following: boolean };
type FollowToggle = {
  memberId: string;
  sellerId: string;
  next: boolean;
  /** 실패하면 되돌릴 누르기 전 표시. */
  previous: FollowOverride | null;
};

const realProduct = {
  title: "라이브 방송",
  seller: "판매자",
  poster: "/images/buyer-project/live-poster.png",
  avatar: "/images/buyer-live/seller-4.png",
  productImage: "/images/buyer-live/413b1.png",
};

export function RealBuyerLive({
  liveId,
  replay = false,
  clip = false,
  clipId,
  desktop = false,
}: {
  liveId: string;
  replay?: boolean;
  /** 다시보기의 숏 클립 화면(`?mode=replay&view=clip`). */
  clip?: boolean;
  /** 재생할 쇼츠의 하이라이트 id(`&clip=`). 없거나 맞지 않으면 첫 쇼츠를 재생한다. */
  clipId?: string;
  desktop?: boolean;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { state } = useAuth();
  /* 좋아요·팔로우는 인증이 필요하다. 비로그인이면 로그인으로 보내고 끝난 뒤 이 화면으로 돌아온다. */
  function goToLogin() {
    const returnTo = window.location.pathname + window.location.search;
    router.push(`/auth/login?${new URLSearchParams({ returnTo })}`);
  }
  const playback = useQuery({
    queryKey: ["live", liveId, replay ? "vod" : "playback"],
    queryFn: ({ signal }) => (replay ? getVod(liveId, signal) : getPlayback(liveId, signal)),
    retry: false,
  });
  const isVod = replay || playback.data?.type === "VOD";

  /* 진입 시 내 좋아요 여부는 인증 경로로만 알 수 있어 로그인 상태에서만 읽는다.
     회원이 바뀌면 다른 결과라 memberId를 키에 넣고, 회원 정보가 온 뒤에 한 번만 부른다. */
  const memberId = state.status === "authenticated" ? state.user?.memberId : undefined;
  const likedQuery = useQuery({
    queryKey: ["live", liveId, "liked", memberId],
    queryFn: ({ signal }) => getLiveLiked(liveId, signal),
    enabled: memberId !== undefined,
    retry: false,
  });
  /* 누른 뒤에는 좋아요 응답의 liked·likeCount가 가장 최신이라 playback·조회 값보다 앞선다.
     누른 회원의 결과만 쓴다. 같은 화면에서 로그아웃하거나 계정을 바꾸면 이전 표시가 남지 않게 한다. */
  const [override, setOverride] = useState<{
    memberId: string | undefined;
    result: LikeResult;
  } | null>(null);
  const likeOverride = override && override.memberId === memberId ? override.result : null;
  const liked = likeOverride?.liked ?? likedQuery.data?.liked ?? false;
  const likeCount = likeOverride?.likeCount ?? playback.data?.likeCount ?? 0;
  /* 내 좋아요 여부를 처음 불러오는 동안은 버튼이 실제와 다르게 꺼져 보일 수 있어 누르지 않는다.
     한 번이라도 실패했으면 막지 않는다. 데이터 없이 실패한 조회는 재조회 때마다 pending으로
     돌아가므로 isLoading만 보면 그동안 좋아요가 계속 막힌다. 렌더에서 계산해야 한다 — TanStack은
     렌더 중에 읽은 속성이 바뀔 때만 다시 그리므로, 핸들러 안에서만 읽으면 실패해도 다시 그려지지
     않아 핸들러가 이전 pending 상태를 보고 계속 막는다. */
  const likedFirstLoading = likedQuery.isLoading && likedQuery.errorUpdateCount === 0;
  const toggleLike = useMutation({
    mutationFn: (next: boolean) => (next ? likeLive(liveId) : unlikeLive(liveId)),
    onSuccess: (result) => setOverride({ memberId, result }),
  });
  function onToggleLike() {
    /* 로그인 확인 중에는 아직 알 수 없어 아무것도 하지 않는다. */
    if (state.status === "checking") return;
    if (state.status === "guest") {
      goToLogin();
      return;
    }
    if (likedFirstLoading || toggleLike.isPending) return;
    const next = !liked;
    const previous = override;
    /* 응답 전에는 누르면 +1, 취소하면 -1로 먼저 그린다. 재생 정보가 오기 전(수 0)에 취소해도
       음수로 보이지 않게 막는다. 실패하면 누르기 전 상태로 되돌린다. */
    setOverride({
      memberId,
      result: { liked: next, likeCount: Math.max(0, likeCount + (next ? 1 : -1)) },
    });
    toggleLike.mutate(next, { onError: () => setOverride(previous) });
  }

  /* LIVE 응답에는 판매자가 없어 연결 프로젝트 상세의 seller로 판매자 행을 그린다. 프로젝트 상세
     화면과 같은 키·조회라 캐시를 함께 쓴다. 판매자 행은 실시간 시청 화면에만 있어 다시보기에서는
     부르지 않는다. 실패하면 판매자 행만 그리지 않고 시청은 그대로 둔다. */
  const liveProjectId = isVod ? undefined : playback.data?.projectId;
  const project = useQuery({
    queryKey: ["public-project", liveProjectId],
    queryFn: ({ signal }) => getPublicProject(liveProjectId!, signal),
    enabled: liveProjectId !== undefined,
    retry: false,
  });
  const seller = project.data?.seller;
  /* 자기 자신은 팔로우할 수 없어(BE 400) 본인 LIVE에서는 팔로우 버튼을 그리지 않는다. */
  const ownLive = seller !== undefined && seller.sellerId === memberId;
  /* 판매자 한 명의 팔로우 여부를 묻는 API가 없어 내 팔로우 목록으로 판단한다. 프로젝트 상세와
     나란히 부르도록 판매자를 기다리지 않는다. */
  const follows = useQuery({
    queryKey: followsQueryKey(memberId),
    queryFn: ({ signal }) => getAllFollows(signal),
    enabled: memberId !== undefined && liveProjectId !== undefined,
    retry: false,
  });
  /* 누른 직후에는 누른 값을 먼저 그린다. 좋아요와 같이 누른 회원·판매자의 값만 쓴다. */
  const [followOverride, setFollowOverride] = useState<FollowOverride | null>(null);
  const followOverrideValue =
    followOverride &&
    followOverride.memberId === memberId &&
    followOverride.sellerId === seller?.sellerId
      ? followOverride.following
      : undefined;
  const following =
    followOverrideValue ??
    follows.data?.some((follow) => follow.sellerId === seller?.sellerId) ??
    false;
  /* 좋아요와 같은 이유로 렌더에서 계산한다. 목록을 처음 불러오는 동안은 실제와 다르게 보일 수 있어
     누르지 않고, 한 번이라도 실패했으면 막지 않는다(팔로우·언팔로우 모두 idempotent). */
  const followsFirstLoading = follows.isLoading && follows.errorUpdateCount === 0;
  /* 응답 전 연타는 요청 한 번으로 막는다. 대기 상태가 다시 그려지기 전에 들어온 클릭도 막도록 ref로 둔다. */
  const followPending = useRef(false);
  const toggleFollow = useMutation({
    mutationFn: async ({ sellerId, next }: FollowToggle) => {
      if (next) await followSeller(sellerId);
      else await unfollowSeller(sellerId);
    },
    onError: (_error, { previous }) => setFollowOverride(previous),
    onSettled: (_data, _error, variables) => {
      followPending.current = false;
      /* 같은 키를 쓰는 다른 화면(LIVE 메인 팔로우한 창작자)이 이전 목록을 쓰지 않게 서버 값으로 다시 맞춘다.
         실패한 요청이 서버에 반영됐을 수도 있어 실패해도 다시 읽는다. */
      void queryClient.invalidateQueries({ queryKey: followsQueryKey(variables.memberId) });
    },
  });
  function onToggleFollow() {
    if (state.status === "checking") return;
    if (state.status === "guest") {
      goToLogin();
      return;
    }
    /* 회원 정보가 오기 전에는 본인 LIVE인지 알 수 없어 누르지 않는다. */
    if (memberId === undefined || seller === undefined || ownLive) return;
    if (followsFirstLoading || followPending.current) return;
    followPending.current = true;
    const next = !following;
    const previous = followOverride;
    setFollowOverride({ memberId, sellerId: seller.sellerId, following: next });
    toggleFollow.mutate({ memberId, sellerId: seller.sellerId, next, previous });
  }
  /* 로그인했지만 회원 정보를 받지 못하면(/members/me 일시 실패) 본인 LIVE인지·팔로우 여부를 알 수 없고
     눌러도 보낼 수 없다. 반응 없는 버튼을 두지 않게 본인 LIVE처럼 그리지 않는다. */
  const followUnknown = state.status === "authenticated" && memberId === undefined;
  /* 판매자 이름은 BE가 null을 줄 수 있어(판매자 프로필 없음) 기존 자리표시자로 둔다. */
  const liveSeller = seller && {
    name: seller.displayName || realProduct.seller,
    following,
    onToggleFollow: ownLive || followUnknown ? undefined : onToggleFollow,
  };

  /* 구간 조회는 조회 수로 잡히는 호출이라(BE 주석) 다시보기에서 한 번만 읽는다. */
  const seekRef = useRef<LivePlayerHandle | null>(null);
  const [position, setPosition] = useState({ currentSec: 0, durationSec: 0 });
  const highlights = useQuery({
    queryKey: ["live", liveId, "highlights-public"],
    /* 이 호출이 조회 수로 잡힌다(BE 주석). signal을 넘기지 않는다 — 뷰포트 전환(LiveViewport가
       모바일로 먼저 그린 뒤 데스크톱으로 바꾼다)으로 언마운트되면 요청이 취소되고 새 요청이
       나가는데, 서버는 이미 첫 요청을 받아 조회가 두 번 잡힌다. staleTime으로 재조회도 막는다. */
    queryFn: () => getPublicHighlights(liveId),
    enabled: isVod,
    retry: false,
    staleTime: Infinity,
  });
  /* 숏 클립은 원본 VOD의 구간이 아니라 따로 렌더된 영상(clipUrl)이다. 방송 구간 탐색·시킹은
     클립 재생 위치와 맞지 않아 클립 화면에서는 구간을 쓰지 않는다. */
  const markers = clip ? [] : (highlights.data?.markers ?? []);
  const shortClip = clip ? pickClip(highlights.data?.clips ?? [], clipId) : null;
  /* 쇼츠를 띄우면 그 하이라이트의 클릭을 한 번 기록한다. 조회 수와 같은 이유로 signal을 넘기지
     않고 staleTime으로 뷰포트 전환·재렌더 때 다시 보내지 않는다. 기록은 추적용이라 실패해도
     재생을 막거나 화면에 드러내지 않는다. */
  useQuery({
    queryKey: ["live", liveId, "highlight-click", shortClip?.highlightId],
    queryFn: () => recordHighlightClick(liveId, shortClip!.highlightId).then(() => null),
    enabled: Boolean(shortClip),
    retry: false,
    staleTime: Infinity,
  });
  const chapters = toChapters(markers, position.durationSec);
  const progress = position.durationSec
    ? Math.min(100, (position.currentSec / position.durationSec) * 100)
    : 0;
  const range = chapterRange(markers, position.currentSec, position.durationSec);
  const vodChat = useQuery({
    queryKey: ["live", liveId, "vod-chat", range?.fromSec, range?.toSec],
    queryFn: ({ signal }) => getVodChat(liveId, range!.fromSec, range!.toSec, signal),
    enabled: isVod && range !== null,
    retry: false,
  });
  /* 렌더마다 새 배열을 만들면 이 트리가 초당 한 번(timeupdate) 다시 그려질 때 다시보기
     화면의 채팅 자동 스크롤이 매번 다시 돌아 사용자가 위로 올려 둔 위치가 풀린다. */
  const vodChatMessages = useMemo(
    () =>
      (vodChat.data ?? []).map((message, index) => ({
        id: `${message.offsetSec}:${index}`,
        author: "시청자",
        text: message.content,
      })),
    [vodChat.data],
  );
  const questions = useQuery({
    queryKey: ["live", liveId, "answered-questions"],
    queryFn: ({ signal }) => getAnsweredQuestions(liveId, signal),
    retry: false,
  });
  /* 다시보기·데스크톱 쇼츠는 화면이 Figma 재생바를 그리므로 영상의 기본 컨트롤을 끄고 재생 상태·
     위치를 올려받는다. Figma 모바일 쇼츠에는 재생바가 없어 기본 컨트롤을 둔다. */
  const [playing, setPlaying] = useState(false);
  function trackProgress(currentSec: number, durationSec: number) {
    setPosition((previous) =>
      /* timeupdate는 초당 여러 번 온다. 화면이 쓰는 단위는 1초라 같은 초면 그대로 둬서
         이 트리 전체가 다시 그려지지 않게 한다. */
      previous.currentSec === Math.floor(currentSec) && previous.durationSec === durationSec
        ? previous
        : { currentSec: Math.floor(currentSec), durationSec },
    );
  }
  const playbackProps = {
    playing,
    onTogglePlay: () => seekRef.current?.togglePlay(),
    timeText: {
      current: formatPlaybackTime(position.currentSec),
      duration: formatPlaybackTime(position.durationSec),
    },
  };
  /* AI가 제목·자막을 영상에 번인해 두므로 화면 자막을 겹쳐 그리지 않는다. VOD가 준비되지 않아도
     쇼츠는 따로 서빙되므로 클립 화면은 VOD 재생 정보에 기대지 않는다. */
  const video = clip ? (
    highlights.isPending ? (
      <p>쇼츠를 불러오는 중입니다.</p>
    ) : highlights.isError ? (
      <QueryError error={highlights.error} retry={() => void highlights.refetch()} />
    ) : shortClip?.clipUrl ? (
      <LivePlayer
        key={shortClip.highlightId}
        src={shortClip.clipUrl}
        title={shortClip.title ?? "숏 클립"}
        handleRef={seekRef}
        onProgress={trackProgress}
        controls={!desktop}
        onPlayingChange={setPlaying}
      />
    ) : (
      <div className="text-text-static-white grid h-full place-items-center p-6 text-center">
        <div>
          <p>공개된 쇼츠가 없습니다.</p>
          <Link
            href={`/live/${encodeURIComponent(liveId)}?mode=replay`}
            className="mt-3 inline-block underline"
          >
            다시보기로 이동
          </Link>
        </div>
      </div>
    )
  ) : playback.isPending ? (
    <p>영상을 불러오는 중입니다.</p>
  ) : playback.isError ? (
    <QueryError error={playback.error} retry={() => void playback.refetch()} />
  ) : (
    <LivePlayer
      src={playback.data.playbackUrl}
      title={playback.data.type === "VOD" ? "다시보기" : "라이브"}
      handleRef={seekRef}
      onProgress={trackProgress}
      controls={!isVod}
      onPlayingChange={setPlaying}
    />
  );
  const questionData =
    questions.data?.map((question) => ({
      id: question.questionId,
      title: question.summaryText,
      count: question.questionCount,
      answer: question.answerText,
      answeredBy: answeredByLabel(question.answeredBy),
    })) ?? [];
  const questionState = questions.isPending ? (
    <p>질문을 불러오는 중입니다.</p>
  ) : questions.isError ? (
    <QueryError error={questions.error} retry={() => void questions.refetch()} />
  ) : questions.data?.length ? undefined : (
    <p>등록된 답변이 없습니다.</p>
  );
  const clipProps = shortClip
    ? { clipTitle: shortClip.title ?? "숏 클립", clipBadge: clipBadge(shortClip.sceneLabel) }
    : { clipTitle: "숏 클립", clipBadge: "숏 클립" };
  if (desktop)
    return (
      <BuyerLiveDesktop
        key={liveId}
        liveId={liveId}
        replay={isVod}
        clip={clip}
        {...clipProps}
        {...playbackProps}
        product={realProduct}
        rewardSummary={null}
        questions={questionData}
        questionsState={questionState}
        onRefreshQuestions={() => void questions.refetch()}
        chapters={chapters}
        progress={progress}
        onSeek={(percent) => seekRef.current?.seek((percent / 100) * position.durationSec)}
        liked={liked}
        likeCount={likeCount}
        onToggleLike={onToggleLike}
        seller={liveSeller}
        replayMessages={isVod ? vodChatMessages : undefined}
        /* 다시보기 채팅은 구간별로 불러와 처음에는 비어 있기 쉽다. 빈 패널 대신 구간 탐색부터 연다. */
        initialPanel={isVod ? "chapters" : undefined}
        video={video}
        videoConnected={clip ? Boolean(shortClip) : playback.isSuccess}
        demoMode={false}
      />
    );
  if (isVod)
    return (
      <BuyerLiveReplay
        key={liveId}
        liveId={liveId}
        clip={clip}
        clipId={shortClip?.highlightId}
        {...clipProps}
        {...playbackProps}
        product={{ ...realProduct, title: "다시보기" }}
        demoMode={false}
        video={video}
        chapters={chapters}
        progress={progress}
        onSeek={(percent) => seekRef.current?.seek((percent / 100) * position.durationSec)}
        liked={liked}
        onToggleLike={onToggleLike}
        replayMessages={vodChatMessages}
        questionsData={questionData}
        questionsState={questionState}
        onRefreshQuestions={() => void questions.refetch()}
      />
    );
  return (
    <BuyerLiveRoom
      liveId={liveId}
      product={{ ...realProduct, title: "라이브 방송" }}
      video={video}
      questionsData={questionData}
      questionsState={questionState}
      demoMode={false}
      onRefreshQuestions={() => void questions.refetch()}
      liked={liked}
      likeCount={likeCount}
      onToggleLike={onToggleLike}
      seller={liveSeller}
    />
  );
}
