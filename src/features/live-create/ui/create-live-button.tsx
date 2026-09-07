"use client";

import { useEffect, useRef, useState } from "react";
import { Button, secondaryButtonClasses } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Icon } from "@/shared/components/ui/icon";
import { Modal } from "@/shared/components/ui/modal";
import { Select } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { LiveCueSheetFlow } from "@/features/live-cue-sheet/ui/live-cue-sheet-flow";
import type { SavedCueSheet } from "@/features/live-cue-sheet/model/cue-sheet-demo";

type PickableProject = {
  id: string;
  title: string;
  category: string;
  period: string;
  participantCount: number;
  currentAmount: number;
  goalAmount: number;
};

/* ponytail: 와이어프레임 더미. 판매자 프로젝트 목록 API가 붙으면 통째로 걷어낸다.
   seller/projects/page.tsx의 mockProjects와 같은 이유로 필드 확정이 선행돼야 한다. */
const mockProjects: PickableProject[] = [
  {
    id: "p-1",
    title: "로보락 F25",
    category: "가전",
    period: "2026.07.01 - 2026.08.12",
    participantCount: 132,
    currentAmount: 6_400_000,
    goalAmount: 5_000_000,
  },
  {
    id: "p-2",
    title: "식기세척기",
    category: "가전",
    period: "2026.07.01 - 2026.08.12",
    participantCount: 132,
    currentAmount: 6_400_000,
    goalAmount: 5_000_000,
  },
  {
    id: "p-3",
    title: "세탁기",
    category: "가전",
    period: "2026.07.01 - 2026.08.12",
    participantCount: 132,
    currentAmount: 6_400_000,
    goalAmount: 5_000_000,
  },
  {
    id: "p-4",
    title: "친환경 소재로 만든 데일리 백",
    category: "가방",
    period: "2026.07.01 - 2026.08.12",
    participantCount: 132,
    currentAmount: 1_600_000,
    goalAmount: 5_000_000,
  },
];

/* ponytail: Figma 드롭다운 항목이 "카테고리 선택 아코디언" 더미라 카테고리 분류 체계가 없다.
   지어내지 않고 프로젝트 목록에 실제로 있는 값에서 뽑는다. 분류가 확정되면 config로 옮긴다. */
const categories = Array.from(new Set(mockProjects.map((project) => project.category)));

const INTRO_MAX_LENGTH = 300;

const won = (value: number) => `${value.toLocaleString("ko-KR")}원`;

function ProjectSummary({
  action,
  project,
}: {
  action?: React.ReactNode;
  project: PickableProject;
}) {
  return (
    <div className="border-w-xs border-border-default flex items-center justify-between gap-4 rounded-xs p-5">
      <div className="flex min-w-0 flex-1 gap-4">
        <div className="bg-border-default text-body-s text-text-primary-live flex size-[81px] shrink-0 items-center justify-center rounded-xs">
          IMG
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="text-body-strong truncate">{project.title}</p>
          <p className="text-caption-m text-text-secondary flex min-w-0 items-center gap-1 truncate">
            <span>{project.category}</span>
            <span aria-hidden>·</span>
            <span className="truncate">{project.period}</span>
            <span aria-hidden>·</span>
            <span className="inline-flex shrink-0 items-center gap-1">
              <Icon name="people" className="size-3.5" />
              {project.participantCount}명
            </span>
          </p>
          <p className="mt-3 flex items-baseline gap-1">
            <span className="text-title-s">{won(project.currentAmount)}</span>
            <span className="text-body-s text-text-secondary">/ {won(project.goalAmount)}</span>
          </p>
        </div>
      </div>
      {action}
    </div>
  );
}

export function CreateLiveButton() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"form" | "confirm" | "cue">("form");
  const [savedCueSheet, setSavedCueSheet] = useState<SavedCueSheet | null>(null);
  const [showStartNotice, setShowStartNotice] = useState(false);
  const [category, setCategory] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [intro, setIntro] = useState("");
  const [scheduled, setScheduled] = useState(false);

  const selectedProject = mockProjects.find((project) => project.id === projectId) ?? null;
  const canProceed = selectedProject !== null && intro.trim().length > 0;

  /* 스텝·뷰가 바뀌면 방금 누른 버튼이 사라지며 포커스가 <body>로 떨어진다.
     키보드·스크린 리더 사용자가 위치를 잃지 않게 다음에 조작할 곳으로 옮긴다. */
  const introRef = useRef<HTMLTextAreaElement>(null);
  const projectListRef = useRef<HTMLUListElement>(null);
  const confirmHeadingRef = useRef<HTMLParagraphElement>(null);
  const prevProjectId = useRef(projectId);
  const prevStep = useRef(step);

  useEffect(() => {
    const changed = prevProjectId.current !== projectId;
    prevProjectId.current = projectId;
    if (!open || !changed || step !== "form") return;
    /* 선택 → 소개 문구 입력, 취소 → 프로젝트 목록. */
    (projectId !== null ? introRef.current : projectListRef.current)?.focus();
  }, [open, projectId, step]);

  useEffect(() => {
    const changed = prevStep.current !== step;
    prevStep.current = step;
    if (!open || !changed || step !== "confirm") return;
    confirmHeadingRef.current?.focus();
  }, [open, step]);

  const close = () => {
    setOpen(false);
    /* 다음에 열 때 이전 입력이 남아 있지 않게 되돌린다. 임시저장은 별도 흐름이다. */
    setStep("form");
    setCategory("");
    setProjectId(null);
    setIntro("");
    setScheduled(false);
    setSavedCueSheet(null);
    setShowStartNotice(false);
  };

  return (
    <>
      <Button className="text-body-emphasis w-45" onClick={() => setOpen(true)} size="md">
        라이브 생성하기
      </Button>

      <Modal className="h-168" onClose={close} open={open && step !== "cue"} title="LIVE 생성하기">
        {step === "form" ? (
          <div className="flex h-full flex-col">
            <Select
              aria-label="카테고리 선택"
              className="mt-6 shrink-0"
              onChange={(event) => {
                setCategory(event.target.value);
                setProjectId(null);
                setIntro("");
                setSavedCueSheet(null);
              }}
              value={category}
            >
              <option value="">카테고리 선택</option>
              {categories.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>

            {selectedProject ? (
              <>
                <div className="mt-2 shrink-0">
                  <ProjectSummary
                    action={
                      <button
                        className={`${secondaryButtonClasses} h-9 w-29 shrink-0`}
                        onClick={() => setProjectId(null)}
                        type="button"
                      >
                        취소
                      </button>
                    }
                    project={selectedProject}
                  />
                </div>
                <Textarea
                  aria-label="소개 문구"
                  className="mt-2 h-40 shrink-0"
                  maxLength={INTRO_MAX_LENGTH}
                  onChange={(event) => {
                    setIntro(event.target.value);
                    setSavedCueSheet(null);
                  }}
                  placeholder={`소개 문구를 입력해주세요 (최대 ${INTRO_MAX_LENGTH}자)`}
                  ref={introRef}
                  value={intro}
                />
              </>
            ) : category === "" ? null : (
              <ul
                aria-label="프로젝트 목록"
                className="border-w-xs border-border-default mt-2 flex h-[298px] shrink-0 flex-col gap-2 overflow-y-auto rounded-xs outline-none"
                ref={projectListRef}
                tabIndex={-1}
              >
                {mockProjects
                  .filter((project) => project.category === category)
                  .map((project) => (
                    <li key={project.id}>
                      <ProjectSummary
                        action={
                          <button
                            className={`${secondaryButtonClasses} h-9 w-29 shrink-0`}
                            onClick={() => setProjectId(project.id)}
                            type="button"
                          >
                            선택
                          </button>
                        }
                        project={project}
                      />
                    </li>
                  ))}
              </ul>
            )}

            <div className="mt-auto flex flex-col gap-1">
              <Checkbox
                checked={scheduled}
                onChange={(event) => setScheduled(event.target.checked)}
              >
                방송 예약하기
              </Checkbox>
              {/* 예약을 끄면 서버가 현재 날짜·시각으로 잡는다는 것이 Figma 주석이다.
                  ponytail: 예약 ON 상태 시안이 없어 네이티브 date·time 입력 그대로 둔다. */}
              <div className="flex items-center gap-6">
                <input
                  aria-label="방송 예약 날짜"
                  className="border-w-xs border-border-default text-body-s text-text-default focus:border-border-primary disabled:text-text-disabled h-[46px] flex-1 rounded-xs px-4 outline-none"
                  disabled={!scheduled}
                  type="date"
                />
                <input
                  aria-label="방송 예약 시각"
                  className="border-w-xs border-border-default text-body-s text-text-default focus:border-border-primary disabled:text-text-disabled h-[46px] flex-1 rounded-xs px-4 outline-none"
                  disabled={!scheduled}
                  type="time"
                />
              </div>
            </div>

            <div className="mt-[58px] flex shrink-0 items-center justify-between">
              {/* ponytail: 임시저장 목록 화면도 저장 API도 아직 없다. 계약이 나오면 disabled를 뗀다. */}
              <button className={`${secondaryButtonClasses} h-10 w-23`} disabled type="button">
                불러오기
              </button>
              <div className="flex items-center gap-3">
                <button className={`${secondaryButtonClasses} h-10 w-23`} disabled type="button">
                  임시저장
                </button>
                {/* size="sm"로 두는 건 md가 강제하는 text-title-s(18px)를 피하려는 것.
                    Figma bottom_bt의 `다음`은 14px Medium이고, 비활성일 때 보조 버튼보다
                    진한 회색 면 + 흰 글자(layer-surface-primary-disabled)로 구분된다. */}
                <Button
                  className="text-body-s disabled:bg-layer-surface-primary-disabled disabled:text-text-inverse h-10 w-36 font-medium"
                  disabled={!canProceed}
                  onClick={() => setStep("confirm")}
                  size="sm"
                >
                  다음
                </Button>
              </div>
            </div>
          </div>
        ) : (
          selectedProject && (
            <div className="flex h-full flex-col">
              <p
                className="text-title-s mt-12 shrink-0 text-center font-medium outline-none"
                ref={confirmHeadingRef}
                tabIndex={-1}
              >
                입력된 내용이 맞는지 확인해주세요
              </p>
              <div className="mt-[35px] shrink-0">
                <ProjectSummary project={selectedProject} />
              </div>
              <Textarea
                aria-label="소개 문구"
                className="mt-2 h-40 shrink-0"
                maxLength={INTRO_MAX_LENGTH}
                readOnly
                value={intro}
              />
              {/* AI 큐시트는 현재 선택한 프로젝트를 전달하는 로컬 목업이다.
                  라이브 시작은 생성 API 계약 확정 후 연결한다.
                  size="sm"은 md가 강제하는 text-title-s(18px)를 피하려는 것 — Figma cta_button의
                  `라이브 시작`은 16px SemiBold(text-body-m + font-semibold). */}
              <p role="status" className="text-caption-s mt-6 text-center">
                {showStartNotice
                  ? "목업 화면입니다. 실제 방송은 시작되지 않습니다. 송출 기능은 연동 예정입니다."
                  : savedCueSheet
                    ? "저장된 목업 큐시트가 있어요. 다시 열어 편집할 수 있습니다."
                    : "AI 큐시트는 목업입니다. 실제 생성·서버 저장은 하지 않습니다."}
              </p>
              <div className="mt-auto flex shrink-0 items-center gap-3">
                <button
                  className={`${secondaryButtonClasses} h-10 flex-1`}
                  onClick={() => {
                    setShowStartNotice(false);
                    setStep("cue");
                  }}
                  type="button"
                >
                  AI 큐시트 생성
                </button>
                <Button
                  className="h-10 flex-1 font-semibold"
                  size="sm"
                  onClick={() => setShowStartNotice(true)}
                >
                  라이브 시작
                </Button>
              </div>
            </div>
          )
        )}
      </Modal>
      {open && step === "cue" && selectedProject && (
        <LiveCueSheetFlow
          key={selectedProject.id}
          project={{ ...selectedProject, description: intro }}
          initialStep={savedCueSheet ? "editor" : "chat"}
          initialSavedCueSheet={savedCueSheet ?? undefined}
          onClose={() => setStep("confirm")}
          onSave={(saved) => {
            setSavedCueSheet(saved);
            setStep("confirm");
          }}
        />
      )}
    </>
  );
}
