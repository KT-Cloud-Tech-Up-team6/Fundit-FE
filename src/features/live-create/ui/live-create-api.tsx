"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import { LoginRedirect } from "@/providers/login-redirect";
import {
  createLive,
  updateLiveSettings,
  type LiveCreateResponse,
} from "@/entities/live/api/live-session-api";
import {
  isEmptyLiveSettingsBody,
  LIVE_INTRO_MAX_LENGTH,
  toLiveSettingsBody,
  toScheduledStartAt,
} from "@/entities/live/model/live-settings";
import { getProjectPreview } from "@/entities/project/api/seller-project-api";
import { LiveCueSheetApi } from "@/features/live-cue-sheet/ui/live-cue-sheet-api";
import { Button, secondaryButtonClasses } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Modal } from "@/shared/components/ui/modal";
import { Textarea } from "@/shared/components/ui/textarea";
import { ProjectSummary, type LiveProjectSummary } from "./project-summary";

function errorMessage(error: unknown) {
  return error instanceof Error && error.message ? error.message : "잠시 후 다시 시도해 주세요.";
}

/**
 * `/seller/projects/{projectId}/live/new`의 LIVE 생성.
 *
 * 원본(FL_S_LV_CREATE_1~8)의 흐름은 **카테고리 → 프로젝트 선택 → 소개 문구 → 생성 확인**이다.
 * 이 경로는 프로젝트가 주소에 박혀 있으므로 앞 두 단계가 이미 끝난 상태에서 시작한다.
 * 화면 구성은 원본의 `프로젝트 선택 완료`(CREATE_5)·`생성 확인`(CREATE_8)과 같다.
 *
 * <p>LIVE는 **다음·임시저장을 처음 누를 때** 만든다. 화면을 여는 것만으로 DRAFT가 쌓이면
 * 판매자가 만들지 않은 LIVE가 스튜디오 목록에 남는다. 만든 뒤에는 같은 liveId에 설정만
 * 덮어써 새로고침·재시도가 LIVE를 늘리지 않는다.
 */
export function LiveCreateApi({ projectId }: { projectId: string }) {
  const { state } = useAuth();
  const router = useRouter();
  const cache = useQueryClient();
  const owner = state.user?.memberId;
  const enabled = state.status === "authenticated" && Boolean(owner);

  const [step, setStep] = useState<"form" | "confirm">("form");
  const [intro, setIntro] = useState("");
  const [scheduled, setScheduled] = useState(false);
  const [liveId, setLiveId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  /* 원본 FL_S_LV_CREATE_8은 큐시트를 저장하고 돌아오면 확인 화면에 툴팁을 띄운다. */
  const [cueOpen, setCueOpen] = useState(false);
  const [cueSaved, setCueSaved] = useState(false);
  const confirmHeadingRef = useRef<HTMLParagraphElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const timeRef = useRef<HTMLInputElement>(null);
  const prevStep = useRef(step);

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

  const preview = useQuery({
    queryKey: ["seller-project-preview", owner, projectId],
    queryFn: ({ signal }) => getProjectPreview(projectId, signal),
    enabled,
  });

  const save = useMutation({
    mutationFn: async (mode: "draft" | "next") => {
      const id = liveId ?? (await createLive(projectId)).liveId;
      if (!id) throw new Error("LIVE 식별자를 받지 못했습니다.");
      const body = toLiveSettingsBody({
        categoryMajor: preview.data?.categoryMajor,
        categoryMinor: preview.data?.categoryMinor,
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
      cache.setQueryData<LiveCreateResponse>(["live-create", owner, projectId], {
        liveId: id,
        status: "DRAFT",
      });
      void cache.invalidateQueries({ queryKey: ["seller-lives"] });
      void cache.invalidateQueries({ queryKey: ["live-summary", owner, id] });
      if (mode === "draft") {
        setNotice("임시저장했습니다. LIVE 스튜디오의 준비중 탭에서 이어서 작성할 수 있습니다.");
        return;
      }
      setNotice("");
      setStep("confirm");
    },
  });

  if (state.status === "checking") return <p role="status">로그인 상태를 확인하고 있습니다.</p>;
  if (state.status === "guest") return <LoginRedirect />;
  if (!owner)
    return <p role="alert">회원 정보를 확인하지 못했습니다. 새로고침 후 다시 시도해 주세요.</p>;
  if (preview.isPending) return <p role="status">프로젝트를 불러오고 있습니다.</p>;
  if (preview.isError)
    return (
      <div role="alert">
        <p>프로젝트를 불러올 수 없습니다. 접근 권한과 프로젝트 주소를 확인해주세요.</p>
        <button type="button" className="mt-2 underline" onClick={() => void preview.refetch()}>
          다시 시도
        </button>
      </div>
    );

  /* 펀딩 기간·참여자 수·현재 모금액은 preview 응답에 없다. 자리를 만들지 않고 비운다. */
  const project: LiveProjectSummary = {
    id: projectId,
    title: preview.data.title || "제목 없음",
    category: preview.data.categoryMajor ?? "",
    period: "",
    participantCount: null,
    currentAmount: null,
    goalAmount: preview.data.goalAmount,
    image: preview.data.coverImageUrl ?? "",
  };
  const canProceed = intro.trim().length > 0 && !save.isPending;
  const message = save.isError ? `저장하지 못했습니다. ${errorMessage(save.error)}` : notice;

  return (
    <section className="py-9">
      <h1 className="text-heading-s">LIVE 생성</h1>
      <Link href="/seller/live" className="text-body-s mt-2 inline-block underline">
        LIVE 스튜디오로 돌아가기
      </Link>
      <p role="status" className="text-body-s mt-2">
        {message}
      </p>

      <Modal
        className="h-168"
        onClose={() => router.push("/seller/live")}
        open={!cueOpen}
        title="LIVE 생성하기"
      >
        {step === "form" ? (
          <div className="flex h-full flex-col">
            <div className="mt-6 shrink-0">
              {/* 원본의 `취소`는 프로젝트 선택을 되돌리는 버튼이다. 이 경로는 프로젝트가
                  주소에 박혀 있어 되돌릴 대상이 없으므로 자리를 비운다. */}
              <ProjectSummary project={project} />
            </div>
            <Textarea
              aria-label="소개 문구"
              className="mt-2 h-[190px] shrink-0"
              maxLength={LIVE_INTRO_MAX_LENGTH}
              onChange={(event) => setIntro(event.target.value)}
              placeholder={`소개 문구를 입력해주세요 (최대 ${LIVE_INTRO_MAX_LENGTH}자)`}
              value={intro}
            />

            <div className="mt-auto flex flex-col gap-1">
              <Checkbox
                checked={scheduled}
                shape="circle"
                onChange={(event) => setScheduled(event.target.checked)}
              >
                방송 예약하기
              </Checkbox>
              <div className="flex items-center gap-3">
                <input
                  aria-label="방송 예약 날짜"
                  className="border-w-xs border-border-default text-body-s text-text-default focus:border-border-primary disabled:text-text-disabled h-[46px] min-w-0 flex-1 rounded-xs px-4 outline-none"
                  disabled={!scheduled}
                  type="date"
                  ref={(node) => {
                    dateRef.current = node;
                    fillNow(node, todayValue);
                  }}
                />
                <input
                  aria-label="방송 예약 시각"
                  className="border-w-xs border-border-default text-body-s text-text-default focus:border-border-primary disabled:text-text-disabled h-[46px] min-w-0 flex-1 rounded-xs px-4 outline-none"
                  disabled={!scheduled}
                  type="time"
                  ref={(node) => {
                    timeRef.current = node;
                    fillNow(node, timeValue);
                  }}
                />
              </div>
            </div>

            <div className="mt-11 flex shrink-0 flex-wrap items-center justify-between gap-3">
              {/* 임시저장 목록 조회 API가 없다. 계약이 나오면 disabled를 뗀다. */}
              <button
                className={`${secondaryButtonClasses} h-10 w-23`}
                disabled
                title="임시저장 목록 조회 API가 아직 없습니다."
                type="button"
              >
                불러오기
              </button>
              <div className="flex items-center gap-3">
                <button
                  className={`${secondaryButtonClasses} h-10 w-23`}
                  disabled={save.isPending}
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
              {/* 송출은 스트림 키 조회 API가 없어 붙일 수 없다(#289 범위 밖). */}
              <Button
                className="h-10 flex-1 font-semibold"
                size="sm"
                variant="primaryLive"
                disabled
                title="스트림 키 조회 API가 아직 없어 송출을 시작할 수 없습니다."
              >
                LIVE 시작
              </Button>
            </div>
          </div>
        )}
      </Modal>
      {cueOpen && liveId && (
        <LiveCueSheetApi
          liveId={liveId}
          onClose={() => setCueOpen(false)}
          onSaved={() => setCueSaved(true)}
        />
      )}
    </section>
  );
}
