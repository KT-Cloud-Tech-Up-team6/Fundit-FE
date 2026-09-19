"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button, secondaryButtonClasses } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Icon } from "@/shared/components/ui/icon";
import { Modal } from "@/shared/components/ui/modal";
import { Dropdown } from "@/shared/components/ui/dropdown";
import { Textarea } from "@/shared/components/ui/textarea";
import { LiveCueSheetFlow } from "@/features/live-cue-sheet/ui/live-cue-sheet-flow";
import styles from "./create-live.module.css";
import type { SavedCueSheet } from "@/features/live-cue-sheet/model/cue-sheet-demo";

type PickableProject = {
  id: string;
  title: string;
  category: string;
  period: string;
  participantCount: number;
  currentAmount: number;
  goalAmount: number;
  image: string;
};

/* ponytail: 와이어프레임 더미. 판매자 프로젝트 목록 API가 붙으면 통째로 걷어낸다.
   seller/projects/page.tsx의 mockProjects와 같은 이유로 필드 확정이 선행돼야 한다. */
const mockProjects: PickableProject[] = [
  {
    id: "p-1",
    title: "[진짜싹싹] 35,000Pa 초강력 흡입, 가볍게 끝내는 무선청소기",
    category: "테크·가전",
    image: "/images/seller-live/project.png",
    period: "2026.07.01 - 2026.08.12",
    participantCount: 132,
    currentAmount: 6_400_000,
    goalAmount: 5_000_000,
  },
  {
    id: "p-2",
    title: "100°C 트루스팀으로 유해 세균 99.99% 세척하는 식기세척기",
    category: "테크·가전",
    image: "/images/seller-live/dishwasher.png",
    period: "2026.07.01 - 2026.08.12",
    participantCount: 132,
    currentAmount: 6_400_000,
    goalAmount: 5_000_000,
  },
  {
    id: "p-3",
    title: "[전기세 반토막] 역대급 에너지 1등급 스마트 세탁기",
    category: "테크·가전",
    image: "/images/seller-live/washer.png",
    period: "2026.07.01 - 2026.08.12",
    participantCount: 132,
    currentAmount: 6_400_000,
    goalAmount: 5_000_000,
  },
  {
    id: "p-4",
    title: "친환경 소재로 만든 데일리 백",
    category: "패션",
    image: "",
    period: "2026.07.01 - 2026.08.12",
    participantCount: 132,
    currentAmount: 1_600_000,
    goalAmount: 5_000_000,
  },
];

const categories = ["테크·가전", "홈·리빙", "뷰티", "패션", "푸드", "스포츠"];

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
    <div className="border-w-xs border-border-default flex items-center justify-between gap-3 rounded-xs p-3">
      <div className="flex min-w-0 flex-1 gap-4">
        {project.image ? (
          <Image
            src={project.image}
            alt=""
            width={82}
            height={82}
            className="size-[82px] shrink-0 rounded-xs object-cover"
          />
        ) : (
          <span className="bg-layer-bg text-caption-s text-text-secondary flex size-[82px] shrink-0 items-center justify-center rounded-xs">
            이미지 없음
          </span>
        )}
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
  const [category, setCategory] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [intro, setIntro] = useState("");
  const [scheduled, setScheduled] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  function setCurrentSchedule() {
    const now = new Date();
    setDate(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
    );
    setTime(
      `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
    );
  }

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
  };

  return (
    <>
      <Button
        variant="primaryLive"
        appearance="cta"
        className="w-[185px]"
        onClick={() => {
          setCurrentSchedule();
          setOpen(true);
        }}
        size="lg"
      >
        LIVE 생성하기
      </Button>

      <Modal className="h-168" onClose={close} open={open && step !== "cue"} title="LIVE 생성하기">
        {step === "form" ? (
          <div className="flex h-full flex-col">
            <Dropdown
              aria-label="카테고리 선택"
              className={`${styles.category} mt-6 shrink-0`}
              onValueChange={(value) => {
                setCategory(value);
                setProjectId(null);
                setIntro("");
                setSavedCueSheet(null);
              }}
              value={category}
              placeholder="카테고리 선택"
              options={categories.map((name) => ({ value: name, label: name }))}
            />

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
                  className="mt-2 h-[190px] shrink-0"
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
                className="border-w-xs border-border-default [&>li+li]:border-border-default mt-2 flex h-[298px] shrink-0 flex-col overflow-y-auto rounded-xs outline-none [&>li+li]:border-t [&>li>div]:rounded-none [&>li>div]:border-0"
                ref={projectListRef}
                tabIndex={-1}
              >
                {!mockProjects.some((project) => project.category === category) && (
                  <li className="text-body-s text-text-secondary p-4">
                    선택할 프로젝트가 없습니다.
                  </li>
                )}
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
                shape="circle"
                onChange={(event) => {
                  setScheduled(event.target.checked);
                  if (!event.target.checked) setCurrentSchedule();
                }}
              >
                방송 예약하기
              </Checkbox>
              <div className="flex items-center gap-3">
                <input
                  aria-label="방송 예약 날짜"
                  className="border-w-xs border-border-default text-body-s text-text-default focus:border-border-primary disabled:text-text-disabled h-[46px] min-w-0 flex-1 rounded-xs px-4 outline-none"
                  disabled={!scheduled}
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
                <input
                  aria-label="방송 예약 시각"
                  className="border-w-xs border-border-default text-body-s text-text-default focus:border-border-primary disabled:text-text-disabled h-[46px] min-w-0 flex-1 rounded-xs px-4 outline-none"
                  disabled={!scheduled}
                  type="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                />
              </div>
            </div>

            <div className="mt-11 flex shrink-0 flex-wrap items-center justify-between gap-3">
              {/* ponytail: 임시저장 목록 화면도 저장 API도 아직 없다. 계약이 나오면 disabled를 뗀다. */}
              <button className={`${secondaryButtonClasses} h-10 w-23`} disabled type="button">
                불러오기
              </button>
              <div className="flex items-center gap-3">
                <button className={`${secondaryButtonClasses} h-10 w-23`} disabled type="button">
                  임시저장
                </button>
                <Button
                  className="text-body-s h-10 w-36 font-medium disabled:bg-[#cdced4]"
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
                className="text-title-s mt-6 shrink-0 text-center font-medium outline-none"
                ref={confirmHeadingRef}
                tabIndex={-1}
              >
                입력된 내용이 맞는지 확인해주세요
              </p>
              <div className="mt-10 shrink-0">
                <ProjectSummary
                  project={selectedProject}
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
                maxLength={INTRO_MAX_LENGTH}
                readOnly
                value={intro}
              />
              <div className="relative mt-auto flex shrink-0 items-center gap-3 pt-12">
                {savedCueSheet && (
                  <span
                    role="status"
                    className="bg-layer-surface-primary text-text-inverse text-caption-s absolute top-3 left-8 rounded-xs px-2 py-1"
                  >
                    저장된 큐시트가 있어요!
                  </span>
                )}
                <button
                  className={`${secondaryButtonClasses} h-10 flex-1`}
                  onClick={() => {
                    setStep("cue");
                  }}
                  type="button"
                >
                  AI 큐시트 생성
                </button>
                <Button
                  className="h-10 flex-1 font-semibold"
                  size="sm"
                  variant="primaryLive"
                  disabled
                  title="송출 시작 조작은 구현 보류 상태입니다."
                >
                  LIVE 시작
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
