"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import { LoginRedirect } from "@/providers/login-redirect";
import { QueryErrorState } from "@/shared/components/ui/query-error-state";
import {
  getCueSheet,
  requestCueSheet,
  saveCueSheetSegments,
  type CueSheetResponse,
} from "@/entities/live/api/live-cue-sheet-api";
import { findMyLive } from "@/entities/live/api/live-session-api";
import {
  toCueSheetMode,
  toCueSheetSegmentBody,
  toCueSheetState,
  toCueSheetType,
  toTargetDurationSec,
} from "@/entities/live/model/live-cue-sheet";
import { getProjectPreview } from "@/entities/project/api/seller-project-api";
import { ApiError } from "@/shared/api/api-error";
import type { CueScene, CueSheetProject, CueSheetType } from "../model/cue-sheet-demo";
import { LiveCueSheetFlow } from "./live-cue-sheet-flow";

/** 큐시트를 한 번도 요청하지 않은 LIVE는 404다. 오류 화면이 아니라 "아직 없음"이다. */
function isMissing(error: unknown) {
  return error instanceof ApiError && error.status === 404;
}

function errorMessage(error: unknown) {
  return error instanceof Error && error.message ? error.message : "잠시 후 다시 시도해 주세요.";
}

/**
 * 큐시트 화면의 API 연결.
 *
 * `onClose`를 주면 LIVE 생성 흐름 위에 얹힌 모달로 동작한다(원본 FL_S_LV_CREATE_8 →
 * FL_S_LVS_AIC). 주지 않으면 `/seller/live/{liveId}/cue-sheet` 단독 화면이다.
 */
export function LiveCueSheetApi({
  liveId,
  onClose,
  onSaved,
}: {
  liveId: string;
  onClose?: () => void;
  onSaved?: () => void;
}) {
  const { state } = useAuth();
  const cache = useQueryClient();
  const owner = state.user?.memberId;
  const enabled = state.status === "authenticated" && Boolean(owner);
  const cueSheetKey = ["live-cue-sheet", owner, liveId];
  /* 생성 요청 자체가 실패한 사유. 서버에는 아무 상태도 안 남으므로(404=idle) 여기서 들고 있다. */
  const [generateFailure, setGenerateFailure] = useState<string | null>(null);

  const cueSheet = useQuery({
    queryKey: cueSheetKey,
    queryFn: ({ signal }) => getCueSheet(liveId, signal),
    enabled,
    /* 404를 여러 번 두드리지 않는다. 생성을 요청하면 그때 캐시를 갈아 끼운다. */
    retry: false,
    /* 결과는 BE가 AI를 호출해 채운다. 생성 중일 때만 폴링한다. */
    refetchInterval: (query) => (query.state.data?.status === "GENERATING" ? 3000 : false),
  });

  /* liveId만으로 프로젝트를 읽는 판매자 API가 없어 내 LIVE 목록에서 찾는다.
     못 찾아도 큐시트 자체는 동작해야 하므로 실패를 화면 전체 오류로 올리지 않는다. */
  const summary = useQuery({
    queryKey: ["live-summary", owner, liveId],
    queryFn: ({ signal }) => findMyLive(liveId, signal),
    enabled,
  });
  const projectId = summary.data?.projectId;
  const preview = useQuery({
    queryKey: ["seller-project-preview", owner, projectId],
    queryFn: ({ signal }) => getProjectPreview(projectId!, signal),
    enabled: enabled && Boolean(projectId),
  });

  const generate = useMutation({
    mutationFn: (request: { type: CueSheetType; minutes: number }) =>
      requestCueSheet(liveId, {
        mode: toCueSheetMode(request.type),
        targetDurationSec: toTargetDurationSec(request.minutes),
      }),
    onMutate: () => setGenerateFailure(null),
    onSuccess: (response: CueSheetResponse) => {
      /* 202 본문이 이미 GENERATING이다. 캐시에 넣어야 폴링이 곧바로 시작된다. */
      cache.setQueryData(cueSheetKey, response);
    },
    onError: (error) => {
      /* 409는 "이미 생성 중"이라 서버 상태를 읽으면 GENERATING으로 화면이 맞는다.
         그 외 오류는 다시 읽어도 404(=idle)라 phase가 안 바뀌고, 화면은 생성 중에
         멈춘 채 사유도 못 본다. 실패로 내려 사유를 보여준다. */
      if (error instanceof ApiError && error.status === 409) {
        void cueSheet.refetch();
        return;
      }
      setGenerateFailure(errorMessage(error));
    },
  });

  const save = useMutation({
    mutationFn: (scenes: CueScene[]) => saveCueSheetSegments(liveId, toCueSheetSegmentBody(scenes)),
    onSuccess: (response: CueSheetResponse) => {
      cache.setQueryData(cueSheetKey, response);
      onSaved?.();
    },
  });

  if (state.status === "checking") return <p role="status">로그인 상태를 확인하고 있습니다.</p>;
  if (state.status === "guest") return <LoginRedirect />;
  if (!owner)
    return <p role="alert">회원 정보를 확인하지 못했습니다. 새로고침 후 다시 시도해 주세요.</p>;
  if (cueSheet.isPending) return <p role="status">큐시트를 불러오고 있습니다.</p>;
  if (cueSheet.isError && !isMissing(cueSheet.error))
    return (
      <QueryErrorState
        variant={onClose ? "section" : "page"}
        error={cueSheet.error}
        onRetry={() => void cueSheet.refetch()}
        notFoundHref="/seller/projects"
      />
    );

  const fromServer = toCueSheetState(cueSheet.isError ? null : cueSheet.data);
  /* 서버가 GENERATING·COMPLETED를 주면 그쪽이 사실이다. 그 외일 때만 요청 실패를 얹는다. */
  const server =
    generateFailure && fromServer.phase !== "generating" && fromServer.phase !== "completed"
      ? { ...fromServer, phase: "failed" as const, failureReason: generateFailure }
      : fromServer;
  const project: CueSheetProject = {
    title: preview.data?.title || (projectId ? "제목 없음" : "프로젝트 정보 없음"),
    category: preview.data?.categoryMajor ?? "",
    /* 펀딩 기간·참여자·모금액은 LIVE에서 도달할 수 있는 응답에 없다. */
    period: "",
    description: summary.data?.introText ?? "",
    participantCount: null,
    currentAmount: null,
    goalAmount: preview.data?.goalAmount ?? null,
    image: preview.data?.coverImageUrl ?? "",
  };

  const notice = save.isPending
    ? ""
    : save.isError
      ? `큐시트를 저장하지 못했습니다. ${errorMessage(save.error)}`
      : save.isSuccess
        ? "큐시트를 저장했습니다."
        : generate.isError
          ? `큐시트 생성을 요청하지 못했습니다. ${errorMessage(generate.error)}`
          : "";

  return (
    <LiveCueSheetFlow
      liveId={liveId}
      project={project}
      onClose={onClose}
      autoAdvanceGeneration={false}
      /* 이미 완성된 큐시트가 있으면 질문부터 다시 받지 않고 편집기로 연다 —
         데모 모드에서 저장본을 다시 열 때와 같은 자리다. */
      initialStep={
        server.phase === "generating"
          ? "generating"
          : server.phase === "failed"
            ? "failed"
            : server.phase === "completed"
              ? "editor"
              : "chat"
      }
      initialSavedCueSheet={
        server.phase === "completed"
          ? {
              scenes: server.segments,
              type: toCueSheetType(server.mode) ?? "script",
              minutes: server.minutes ?? 0,
            }
          : undefined
      }
      generation={{
        phase: server.phase,
        scenes: server.segments,
        type: toCueSheetType(server.mode),
        minutes: server.minutes,
        failureReason: server.failureReason,
      }}
      onGenerate={(request) => generate.mutate(request)}
      onSave={(saved) => save.mutate(saved.scenes)}
      saving={save.isPending}
      notice={notice}
    />
  );
}
