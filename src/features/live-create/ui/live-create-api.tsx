"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import { LoginRedirect } from "@/providers/login-redirect";
import { QueryErrorState } from "@/shared/components/ui/query-error-state";
import { mainCategories } from "@/entities/category/model/project-categories";
import {
  createLive,
  getLiveDetail,
  startLive,
  updateLiveSettings,
  type LiveCreateResponse,
} from "@/entities/live/api/live-session-api";
import { getAllMyLives, type LiveStatus } from "@/entities/live/api/seller-live-api";
import { liveFailureReason } from "@/entities/live/model/live-error";
import {
  isEmptyLiveSettingsBody,
  LIVE_INTRO_MAX_LENGTH,
  toLiveSettingsBody,
  toScheduledInputs,
  toScheduledStartAt,
} from "@/entities/live/model/live-settings";
import { toSellerLiveList } from "@/entities/live/model/seller-live";
import { getOngoingProjects, getProjectPreview } from "@/entities/project/api/seller-project-api";
import { LiveCueSheetApi } from "@/features/live-cue-sheet/ui/live-cue-sheet-api";
import { Button, secondaryButtonClasses } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Dropdown } from "@/shared/components/ui/dropdown";
import { Modal } from "@/shared/components/ui/modal";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  fromProjectListItem,
  fromProjectPreview,
  projectsInCategory,
  type LiveProjectSummary,
} from "../model/live-project";
import styles from "./create-live.module.css";
import { ProjectSummary } from "./project-summary";
import { StreamInfo } from "./stream-info";

/* 이어 쓸 수 있는 LIVE. 시작·종료한 LIVE는 서버가 설정 저장·시작을 받지 않는다. */
const resumableStatuses: readonly LiveStatus[] = ["DRAFT", "SCHEDULED", "ERROR"];

/* 불러오기 목록은 페이지 없이 한 번에 보여 준다. 스튜디오에서는 모든 프로젝트의 임시저장이
   섞여 한 페이지를 넘을 수 있어 끝 페이지까지 받는다. 한 번에 받는 건수다. */
const DRAFT_PAGE_SIZE = 50;

const categoryOptions = mainCategories.map((name) => ({ value: name, label: name }));

/**
 * LIVE 생성. 원본(FL_S_LV_CREATE_1~8)의 흐름은 **카테고리 → 프로젝트 선택 → 소개 문구 → 생성 확인**이다.
 *
 * - `projectId`가 없으면 LIVE 스튜디오의 [LIVE 생성하기](#418)다. 원본대로 모달 안에서 카테고리와
 *   진행 중 프로젝트를 고르고, 닫으면 `onClose`로 스튜디오에 머문다.
 * - `projectId`가 있으면 `/seller/projects/{projectId}/live/new`다. 프로젝트가 주소에 박혀 있어 앞 두
 *   단계가 끝난 상태로 시작한다. LIVE 스튜디오의 시작 실패 카드가 `resumeLiveId`로 다시 시작할 때
 *   쓴다(#400).
 *
 * <p>LIVE는 **다음·임시저장을 처음 누를 때** 만든다. 화면을 여는 것만으로 DRAFT가 쌓이면
 * 판매자가 만들지 않은 LIVE가 스튜디오 목록에 남는다. 만든 뒤에는 같은 liveId에 설정만
 * 덮어써 새로고침·재시도가 LIVE를 늘리지 않는다.
 */
export function LiveCreateApi({
  projectId: fixedProjectId,
  resumeLiveId,
  onClose,
}: {
  projectId?: string;
  resumeLiveId?: string;
  onClose?: () => void;
}) {
  const { state } = useAuth();
  const router = useRouter();
  const cache = useQueryClient();
  const owner = state.user?.memberId;
  const enabled = state.status === "authenticated" && Boolean(owner);
  const picking = !fixedProjectId;

  const [step, setStep] = useState<"form" | "confirm">("form");
  /* 스튜디오에서 고른 카테고리·프로젝트. 주소로 받은 프로젝트가 있으면 쓰지 않는다. */
  const [category, setCategory] = useState("");
  const [pickedId, setPickedId] = useState<string | null>(null);
  const projectId = fixedProjectId ?? pickedId;
  const [intro, setIntro] = useState("");
  const [scheduled, setScheduled] = useState(false);
  const [liveId, setLiveId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  /* 원본 FL_S_LV_CREATE_8은 큐시트를 저장하고 돌아오면 확인 화면에 툴팁을 띄운다. */
  const [cueOpen, setCueOpen] = useState(false);
  const [cueSaved, setCueSaved] = useState(false);
  const [loadOpen, setLoadOpen] = useState(false);
  /* 불러온 임시저장의 예약 시각. 입력은 비제어라 key로 다시 마운트해 값을 넣는다. */
  const [schedule, setSchedule] = useState<{ date: string; time: string } | null>(null);
  /* 요청 중 표시는 다음 렌더에 반영된다. 그 사이 두 번 누르면 시작이 두 번 나가 성공 뒤 409를 띄운다. */
  const starting = useRef(false);
  const confirmHeadingRef = useRef<HTMLParagraphElement>(null);
  const introRef = useRef<HTMLTextAreaElement>(null);
  const projectListRef = useRef<HTMLUListElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const timeRef = useRef<HTMLInputElement>(null);
  const prevStep = useRef(step);
  const prevPickedId = useRef(pickedId);

  /* 원본 주석: "방송 예약하기 미 선택 시 disable · 현재 날짜, 시간 자동 지정".
     현재 시각은 서버 렌더와 브라우저가 다를 수 있어 state·마크업에 넣지 않는다.
     ref 콜백은 브라우저에서만 돌아 hydration이 어긋나지 않는다. */
  const fillNow = (node: HTMLInputElement | null, value: () => string) => {
    if (node && !node.value) node.value = value();
  };
  const now = () => new Date();
  const todayValue = () => {
    const at = now();
    return `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, "0")}-${String(at.getDate()).padStart(2, "0")}`;
  };
  const timeValue = () => {
    const at = now();
    return `${String(at.getHours()).padStart(2, "0")}:${String(at.getMinutes()).padStart(2, "0")}`;
  };

  /* 단계가 바뀌면 방금 누른 버튼이 사라져 포커스가 <body>로 떨어진다. */
  useEffect(() => {
    const changed = prevStep.current !== step;
    prevStep.current = step;
    if (changed && step === "confirm") confirmHeadingRef.current?.focus();
  }, [step]);

  /* 프로젝트를 고르면 소개 문구로, 취소하면 프로젝트 목록으로 포커스를 옮긴다. */
  useEffect(() => {
    const changed = prevPickedId.current !== pickedId;
    prevPickedId.current = pickedId;
    if (!changed || step !== "form") return;
    (pickedId !== null ? introRef.current : projectListRef.current)?.focus();
  }, [pickedId, step]);

  /* LIVE를 열 수 있는 진행 중 프로젝트만 고른다(2026-09-28 결정). 모달을 열 때 한 번 받아
     카테고리로 추린다 — 목록 API에 카테고리 필터가 없다. */
  const projects = useQuery({
    queryKey: ["seller-projects", owner, "live-pick"],
    queryFn: ({ signal }) => getOngoingProjects(signal),
    enabled: enabled && picking,
  });
  const listed = picking
    ? projects.data?.content.find((item) => item.projectId === pickedId)
    : undefined;
  /* 주소로 받은 프로젝트만 따로 읽는다. 스튜디오는 진행 중 목록 안에서만 고른다. */
  const preview = useQuery({
    queryKey: ["seller-project-preview", owner, fixedProjectId],
    queryFn: ({ signal }) => getProjectPreview(fixedProjectId!, signal),
    enabled: enabled && !picking,
  });
  const project: LiveProjectSummary | null = listed
    ? fromProjectListItem(listed)
    : fixedProjectId && preview.data
      ? fromProjectPreview(fixedProjectId, preview.data)
      : null;
  /* 지금 소개 문구·liveId가 속한 프로젝트. 같은 프로젝트를 다시 고르면 둘 다 이어 쓴다. */
  const liveProjectRef = useRef<string | null>(null);

  const save = useMutation({
    /* 불러오기 실패 안내가 남아 있으면 저장 결과 안내를 가린다. 저장을 시작하면 지운다. */
    onMutate: () => load.reset(),
    mutationFn: async (mode: "draft" | "next") => {
      if (!projectId) throw new Error("프로젝트를 고르지 않았습니다.");
      let id = liveId;
      if (!id) {
        id = (await createLive(projectId)).liveId;
        if (!id) throw new Error("LIVE 식별자를 받지 못했습니다.");
        /* 설정 저장이 실패해도 여기서 만든 LIVE는 이미 서버에 있다. onSuccess를 기다리면
           다음 저장이 createLive를 다시 불러 DRAFT가 쌓인다 — 생성 직후 바로 보존한다. */
        setLiveId(id);
        cache.setQueryData<LiveCreateResponse>(["live-create", owner, projectId], {
          liveId: id,
          status: "DRAFT",
        });
      }
      const body = toLiveSettingsBody({
        categoryMajor: listed?.categoryMajor ?? preview.data?.categoryMajor,
        categoryMinor: listed?.categoryMinor ?? preview.data?.categoryMinor,
        introText: intro,
        scheduledStartAt: scheduled
          ? toScheduledStartAt(dateRef.current?.value ?? "", timeRef.current?.value ?? "")
          : null,
      });
      if (!isEmptyLiveSettingsBody(body)) await updateLiveSettings(id, body);
      return { id, mode };
    },
    onSuccess: ({ id, mode }) => {
      setLiveId(id);
      void cache.invalidateQueries({ queryKey: ["seller-lives"] });
      /* 스튜디오에서 저장하면 모달 뒤 준비중 탭 건수도 바뀐다. */
      void cache.invalidateQueries({ queryKey: ["seller-live-counts", owner] });
      void cache.invalidateQueries({ queryKey: ["live-summary", owner, id] });
      if (mode === "draft") {
        setNotice("임시저장했습니다. LIVE 스튜디오의 준비중 탭에서 이어서 작성할 수 있습니다.");
        return;
      }
      setNotice("");
      setStep("confirm");
    },
  });

  /* 이어서 작성할 후보는 임시저장(DRAFT)뿐이다. 예약까지 마친 SCHEDULED는 생성이 끝난 LIVE라
     여기서 다시 열지 않는다(LIVE 스튜디오 준비중 탭이 맡는다). 주소로 받은 프로젝트면 그
     프로젝트의 것만, 스튜디오면 프로젝트를 고르기 전이라 진행 중 프로젝트의 임시저장 전체를
     보인다 — 원본 IA 19행 "불러오기 누르면 임시 저장 눌렀을 때 상태로 불러와짐"이라 프로젝트도
     되살린다. 진행 중이 아닌 프로젝트는 LIVE를 만들 수 없어(2026-09-28 결정) 목록에서 뺀다. */
  const drafts = useQuery({
    queryKey: ["seller-lives", owner, "drafts", fixedProjectId ?? "all"],
    queryFn: ({ signal }) =>
      getAllMyLives(
        { statuses: ["DRAFT"], projectId: fixedProjectId, size: DRAFT_PAGE_SIZE },
        signal,
      ),
    enabled: enabled && loadOpen,
  });

  const load = useMutation({
    /* 앞선 저장·시작 실패 안내가 남아 있으면 불러오기 결과 안내를 가린다. 불러오기를 시작하면 지운다. */
    onMutate: () => {
      save.reset();
      start.reset();
    },
    mutationFn: (id: string) => getLiveDetail(id),
    onSuccess: (detail) => {
      /* 주소로 받은 LIVE는 이 프로젝트의 시작 전 LIVE일 때만 이어 쓴다. 서버도 시작·종료한 LIVE의
         설정 저장·시작을 409로 막지만, 막힐 입력을 채워 두지 않는다. */
      const outsidePicker =
        picking && !projects.data?.content.some((item) => item.projectId === detail.projectId);
      if (
        (fixedProjectId && detail.projectId !== fixedProjectId) ||
        outsidePicker ||
        !resumableStatuses.includes(detail.status)
      ) {
        /* [불러오기] 모달에서 고른 사이 시작된 경우도 있어, 안내가 보이게 모달을 닫는다. */
        setLoadOpen(false);
        setNotice("이어서 시작할 수 없는 LIVE입니다. LIVE 스튜디오에서 상태를 확인해 주세요.");
        return;
      }
      /* 스튜디오에서는 불러온 LIVE의 프로젝트를 고른 상태로 되살린다. */
      if (picking) setPickedId(detail.projectId);
      /* 같은 liveId에 이어 쓴다. 새로 만들지 않으므로 임시저장이 늘지 않는다. */
      setLiveId(detail.liveId);
      liveProjectRef.current = detail.projectId;
      setIntro(detail.introText ?? "");
      const loaded = toScheduledInputs(detail.scheduledStartAt);
      setSchedule(loaded.date ? loaded : null);
      setScheduled(Boolean(loaded.date));
      setCueSaved(false);
      setLoadOpen(false);
      setNotice(
        detail.status === "ERROR"
          ? "시작에 실패한 LIVE를 불러왔습니다. 내용을 확인하고 다시 시작해 주세요."
          : "임시저장한 LIVE를 불러왔습니다. 이어서 작성할 수 있습니다.",
      );
    },
  });
  const loadLive = load.mutate;

  /* 주소로 받은 LIVE는 로그인이 확인되면 한 번만 불러온다. */
  const resumed = useRef(false);
  useEffect(() => {
    if (!resumeLiveId || !enabled || resumed.current) return;
    resumed.current = true;
    loadLive(resumeLiveId);
  }, [resumeLiveId, enabled, loadLive]);

  const start = useMutation({
    mutationFn: (id: string) => startLive(id),
    onSuccess: (response) => {
      void cache.invalidateQueries({ queryKey: ["seller-lives"] });
      void cache.invalidateQueries({ queryKey: ["seller-live-counts", owner] });
      void cache.invalidateQueries({ queryKey: ["live-summary", owner, response.liveId] });
      router.push(`/seller/live/${encodeURIComponent(response.liveId)}/console`);
    },
    onSettled: () => {
      starting.current = false;
    },
  });

  /* 다른 프로젝트를 고르면 앞서 만든 LIVE와 끊고 소개 문구도 비운다. 연결 프로젝트는 바꿀 수
     없어(요구사항 6.2.4.1) 같은 liveId에 저장하면 원래 프로젝트의 LIVE가 바뀐다. 앞서 임시저장한
     LIVE는 준비중 탭에 남는다. 취소·카테고리 변경 뒤 같은 프로젝트를 다시 고르면 둘 다 그대로
     이어 쓴다 — 끊으면 임시저장이 하나 더 생기고, 문구만 비우면 빈 문구로 저장할 때 서버에는
     예전 문구가 남는다(부분 업데이트). 요청 중에는 고르는 조작이 모두 막혀 있어(busy) 늦게 온
     응답이 고른 값을 덮지 않는다. */
  function pickProject(id: string | null) {
    setPickedId(id);
    setNotice("");
    save.reset();
    start.reset();
    load.reset();
    if (id === null || id === liveProjectRef.current) return;
    liveProjectRef.current = id;
    setIntro("");
    setLiveId(null);
    setCueSaved(false);
  }

  function pickCategory(value: string) {
    setCategory(value);
    pickProject(null);
  }

  if (state.status === "checking") return <p role="status">로그인 상태를 확인하고 있습니다.</p>;
  if (state.status === "guest") return <LoginRedirect />;
  if (!owner)
    return <p role="alert">회원 정보를 확인하지 못했습니다. 새로고침 후 다시 시도해 주세요.</p>;
  if (!picking && preview.isPending) return <p role="status">프로젝트를 불러오고 있습니다.</p>;
  if (!picking && preview.isError)
    return (
      <QueryErrorState
        error={preview.error}
        onRetry={() => void preview.refetch()}
        notFoundHref="/seller/projects"
      />
    );

  /* 불러오는 동안 저장하면 불러올 LIVE 대신 새 임시저장이 생긴다. 시작 중에 프로젝트를 바꾸면
     다른 프로젝트를 고르다 콘솔로 넘어가거나 시작 실패 안내가 사라진다. */
  const busy = save.isPending || load.isPending || start.isPending;
  const canProceed = Boolean(project) && intro.trim().length > 0 && !busy;
  /* BE `message`는 내부 문구라 상태별 FE 문구로 적는다(#403). 409는 이미 시작했거나 끝난 LIVE다. */
  const message = save.isError
    ? `저장하지 못했습니다. ${liveFailureReason(save.error)}`
    : start.isError
      ? `LIVE를 시작하지 못했습니다. ${liveFailureReason(start.error)}`
      : load.isPending && !loadOpen
        ? "LIVE를 불러오고 있습니다."
        : load.isError && !loadOpen
          ? `LIVE를 불러오지 못했습니다. ${liveFailureReason(load.error)}`
          : notice;
  const failed = save.isError || start.isError || (load.isError && !loadOpen);
  /* 생성 모달은 showModal이라 뒤 페이지가 가려지고 inert가 된다. 안내는 모달 안 버튼 줄 아래에 둔다(#403).
     비어 있어도 그려 둬야 라이브 영역이 새 안내를 읽는다. 비었을 때는 높이·여백이 없다. */
  const messageLine = (
    <p
      role="status"
      className={`text-caption-s shrink-0 not-empty:mt-3 ${failed ? "text-text-warning" : "text-text-secondary"}`}
    >
      {message}
    </p>
  );
  /* 스튜디오 불러오기는 여러 프로젝트의 임시저장이 섞이므로 프로젝트명을 함께 적고, 진행 중
     프로젝트의 것만 남긴다. 목록 응답은 toSellerLiveList 결과와 같은 순서다. */
  const projectTitles = new Map(
    (projects.data?.content ?? []).map((item) => [item.projectId, item.title || "제목 없음"]),
  );
  const draftEntries = toSellerLiveList(drafts.data)
    .map((item, index) => ({ item, projectId: drafts.data?.content[index]?.projectId ?? "" }))
    .filter(({ projectId: id }) => !picking || projectTitles.has(id));
  const draftsPending = drafts.isPending || (picking && projects.isPending);
  /* 이미 받은 목록이 있으면 다시 받기만 실패해도 목록을 그대로 둔다. */
  const draftsFailed = drafts.isLoadingError || (picking && projects.isLoadingError);
  const inCategory = projectsInCategory(projects.data?.content ?? [], category);

  const projectPicker = (
    <>
      <Dropdown
        aria-label="카테고리 선택"
        className={`${styles.category} mt-6 shrink-0`}
        disabled={busy}
        onValueChange={pickCategory}
        /* 불러온 임시저장은 고른 카테고리가 없으니 프로젝트의 카테고리를 보인다. */
        value={project?.category || category}
        placeholder="카테고리 선택"
        options={categoryOptions}
      />
      {project ? (
        <div className="mt-2 shrink-0">
          <ProjectSummary
            action={
              <button
                className={`${secondaryButtonClasses} h-9 w-29 shrink-0`}
                disabled={busy}
                onClick={() => {
                  /* 불러온 임시저장은 고른 카테고리가 없다. 그 프로젝트의 카테고리 목록으로 돌아간다. */
                  setCategory(project.category || category);
                  pickProject(null);
                }}
                type="button"
              >
                취소
              </button>
            }
            project={project}
          />
        </div>
      ) : category === "" ? null : (
        <ul
          aria-label="프로젝트 목록"
          className="border-w-xs border-border-default [&>li+li]:border-border-default mt-2 flex h-[298px] shrink-0 flex-col overflow-y-auto rounded-xs outline-none [&>li+li]:border-t [&>li>div]:rounded-none [&>li>div]:border-0"
          ref={projectListRef}
          tabIndex={-1}
        >
          {/* 목록 항목의 역할을 바꾸지 않도록 알림 역할은 항목 안쪽에 둔다. */}
          {projects.isPending ? (
            <li className="text-body-s text-text-secondary p-4">
              <p role="status">프로젝트를 불러오고 있습니다.</p>
            </li>
          ) : projects.isLoadingError ? (
            <li className="text-body-s p-4">
              <p role="alert">
                진행 중인 프로젝트를 불러오지 못했습니다.{" "}
                <button type="button" className="underline" onClick={() => void projects.refetch()}>
                  다시 시도
                </button>
              </p>
            </li>
          ) : inCategory.length === 0 ? (
            <li className="text-body-s text-text-secondary p-4">
              이 카테고리에 진행 중인 프로젝트가 없습니다.
            </li>
          ) : (
            inCategory.map((item) => (
              <li key={item.projectId}>
                <ProjectSummary
                  action={
                    <button
                      className={`${secondaryButtonClasses} h-9 w-29 shrink-0`}
                      disabled={busy}
                      onClick={() => pickProject(item.projectId)}
                      type="button"
                    >
                      선택
                    </button>
                  }
                  project={fromProjectListItem(item)}
                />
              </li>
            ))
          )}
        </ul>
      )}
    </>
  );

  const modals = (
    <>
      <Modal
        className="h-168"
        onClose={onClose ?? (() => router.push("/seller/live"))}
        open={!cueOpen && !loadOpen}
        title="LIVE 생성하기"
      >
        {step === "form" || !project ? (
          <div className="flex h-full flex-col">
            {picking ? (
              projectPicker
            ) : (
              <div className="mt-6 shrink-0">
                {/* 원본의 `취소`는 프로젝트 선택을 되돌리는 버튼이다. 이 경로는 프로젝트가
                    주소에 박혀 있어 되돌릴 대상이 없으므로 자리를 비운다. */}
                {project && <ProjectSummary project={project} />}
              </div>
            )}
            {/* 원본은 프로젝트를 고른 뒤에야 소개 문구 칸을 보인다(FL_S_LV_CREATE_6). */}
            {project && (
              /* 불러오는 동안 입력하면 늦게 온 조회 결과가 덮어쓰므로 입력을 막는다. */
              <Textarea
                aria-label="소개 문구"
                className="mt-2 h-[190px] shrink-0"
                disabled={load.isPending}
                maxLength={LIVE_INTRO_MAX_LENGTH}
                onChange={(event) => setIntro(event.target.value)}
                placeholder={`소개 문구를 입력해주세요 (최대 ${LIVE_INTRO_MAX_LENGTH}자)`}
                ref={introRef}
                value={intro}
              />
            )}

            <div className="mt-auto flex flex-col gap-1">
              <Checkbox
                checked={scheduled}
                disabled={load.isPending}
                shape="circle"
                onChange={(event) => setScheduled(event.target.checked)}
              >
                방송 예약하기
              </Checkbox>
              <div className="flex items-center gap-3">
                <input
                  aria-label="방송 예약 날짜"
                  className="border-w-xs border-border-default text-body-s text-text-default focus:border-border-primary disabled:text-text-disabled h-[46px] min-w-0 flex-1 rounded-xs px-4 outline-none"
                  defaultValue={schedule?.date}
                  disabled={!scheduled || load.isPending}
                  key={`date-${schedule?.date ?? ""}`}
                  type="date"
                  ref={(node) => {
                    dateRef.current = node;
                    fillNow(node, todayValue);
                  }}
                />
                <input
                  aria-label="방송 예약 시각"
                  className="border-w-xs border-border-default text-body-s text-text-default focus:border-border-primary disabled:text-text-disabled h-[46px] min-w-0 flex-1 rounded-xs px-4 outline-none"
                  defaultValue={schedule?.time}
                  disabled={!scheduled || load.isPending}
                  key={`time-${schedule?.time ?? ""}`}
                  type="time"
                  ref={(node) => {
                    timeRef.current = node;
                    fillNow(node, timeValue);
                  }}
                />
              </div>
            </div>

            <div className="mt-11 flex shrink-0 flex-wrap items-center justify-between gap-3">
              <button
                className={`${secondaryButtonClasses} h-10 w-23`}
                disabled={busy}
                onClick={() => {
                  load.reset();
                  setLoadOpen(true);
                }}
                type="button"
              >
                불러오기
              </button>
              <div className="flex items-center gap-3">
                <button
                  className={`${secondaryButtonClasses} h-10 w-23`}
                  disabled={!project || busy}
                  onClick={() => save.mutate("draft")}
                  type="button"
                >
                  임시저장
                </button>
                <Button
                  className="text-body-s h-10 w-36 font-medium disabled:bg-[#cdced4]"
                  disabled={!canProceed}
                  onClick={() => save.mutate("next")}
                  size="sm"
                >
                  다음
                </Button>
              </div>
            </div>
            {messageLine}
          </div>
        ) : (
          <div className="flex h-full flex-col">
            <p
              className="text-title-s mt-6 shrink-0 text-center font-medium outline-none"
              ref={confirmHeadingRef}
              tabIndex={-1}
            >
              입력된 내용이 맞는지 확인해주세요
            </p>
            <div className="mt-10 shrink-0">
              <ProjectSummary
                project={project}
                action={
                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-body-s h-9 w-27"
                    /* 시작 요청 중에 입력 단계로 돌아가면 결과가 다른 화면에서 도착한다. */
                    disabled={start.isPending}
                    onClick={() => setStep("form")}
                  >
                    취소
                  </Button>
                }
              />
            </div>
            <Textarea
              aria-label="소개 문구"
              className="mt-2 h-[190px] shrink-0"
              maxLength={LIVE_INTRO_MAX_LENGTH}
              readOnly
              value={intro}
            />
            <div className="relative mt-auto flex shrink-0 items-center gap-3 pt-12">
              {cueSaved && (
                <span
                  role="status"
                  className="bg-layer-surface-primary text-text-inverse text-caption-s absolute top-3 left-8 rounded-xs px-2 py-1"
                >
                  저장된 큐시트가 있어요!
                </span>
              )}
              <button
                className={`${secondaryButtonClasses} h-10 flex-1`}
                onClick={() => setCueOpen(true)}
                type="button"
              >
                AI 큐시트 생성
              </button>
              <Button
                className="h-10 flex-1 font-semibold"
                size="sm"
                variant="primaryLive"
                disabled={!liveId || start.isPending}
                onClick={() => {
                  if (!liveId || starting.current) return;
                  starting.current = true;
                  start.mutate(liveId);
                }}
              >
                LIVE 시작
              </Button>
            </div>
            {messageLine}
            {liveId && <StreamInfo owner={owner} liveId={liveId} />}
          </div>
        )}
      </Modal>

      {/* 원본에는 불러오기 버튼만 있고 고르는 화면이 없다. 공용 Modal로 최소한만 둔다 —
          이어서 작성할 LIVE를 고르는 자리라 소개 문구와 만든 날짜(스튜디오는 프로젝트명도)만 보여 준다. */}
      <Modal onClose={() => setLoadOpen(false)} open={loadOpen} title="임시저장 불러오기">
        {/* 불러오는 동안 생성 모달은 닫혀 있어, 실패 안내는 고르는 이 자리에 둔다. */}
        {load.isError && (
          <p role="alert" className="text-body-s text-text-error mt-6">
            임시저장한 LIVE를 불러오지 못했습니다. {liveFailureReason(load.error)}
          </p>
        )}
        {draftsPending ? (
          <p role="status" className="mt-6">
            임시저장한 LIVE를 불러오고 있습니다.
          </p>
        ) : draftsFailed ? (
          <div role="alert" className="mt-6">
            <p>임시저장 목록을 불러오지 못했습니다.</p>
            <button
              type="button"
              className="mt-2 underline"
              onClick={() => {
                void drafts.refetch();
                if (picking) void projects.refetch();
              }}
            >
              다시 시도
            </button>
          </div>
        ) : draftEntries.length ? (
          <ul className="mt-6 flex flex-col gap-2">
            {draftEntries.map(({ item, projectId: id }) => (
              <li key={item.id}>
                <button
                  className="border-w-xs border-border-default hover:bg-layer-surface-disabled focus-visible:outline-border-primary flex w-full flex-col items-start gap-1 rounded-xs px-4 py-3 text-left focus-visible:outline-2"
                  disabled={load.isPending}
                  onClick={() => load.mutate(item.id)}
                  type="button"
                >
                  <span className="text-body-s text-text-default">
                    {item.introText || "소개 문구 없음"}
                  </span>
                  <span className="text-caption-s text-text-secondary">
                    {[picking && projectTitles.get(id), `${item.createdAtLabel} 생성`]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-body-s text-text-secondary mt-6 py-10 text-center">
            {picking
              ? "진행 중인 프로젝트에 임시저장한 LIVE가 없습니다."
              : "이 프로젝트에 임시저장한 LIVE가 없습니다."}
          </p>
        )}
      </Modal>

      {cueOpen && liveId && (
        <LiveCueSheetApi
          liveId={liveId}
          onClose={() => setCueOpen(false)}
          onSaved={() => setCueSaved(true)}
        />
      )}
    </>
  );

  /* 스튜디오에서는 스튜디오 화면 위에 모달만 띄운다. */
  if (picking) return modals;
  return (
    <section className="py-9">
      <h1 className="text-heading-s">LIVE 생성</h1>
      <Link href="/seller/live" className="text-body-s mt-2 inline-block underline">
        LIVE 스튜디오로 돌아가기
      </Link>
      {modals}
    </section>
  );
}
