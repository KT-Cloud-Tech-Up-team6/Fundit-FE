"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { ProjectPageHeader } from "@/entities/project/ui/project-sidebar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Pagination } from "@/shared/components/ui/pagination";
import {
  CLIPS_PER_PAGE,
  changedClips,
  clipPage,
  isShownPublic,
  pendingAfterFailure,
  type LiveClip,
  type PendingVisibility,
  type SaveFailure,
} from "../model/live-clips";

/** 제목과 공개 정책 안내(Figma 2321:46431·2321:46433). 목록을 불러오는 동안에도 보인다. */
export function LiveClipIntro() {
  return (
    <>
      {/* Figma 제목의 "LIVE  숏"은 공백이 두 칸인 오타라 한 칸으로 적는다. */}
      <ProjectPageHeader breadcrumb={["내 프로젝트", "LIVE 클립 관리"]} title="LIVE 숏 클립 관리" />
      <div className="bg-layer-bg mt-3 flex flex-col gap-3 rounded-xs px-4 py-3">
        <p className="text-body-s font-medium">AI 자동 생성된 숏 클립은 기본 비공개입니다</p>
        <p className="text-caption-s text-text-secondary">
          공개한 숏 클립만 LIVE 체크에 표시되며, 라이브 다시보기는 항상 공개됩니다.
          <br />
          <span className="font-medium">공개 여부를 선택한 뒤 저장해 주세요.</span>
        </p>
      </div>
    </>
  );
}

/**
 * 숏 클립 공개 여부를 고르고 한 번에 저장한다(FL_S_LV_CLIP). 토글은 저장 전까지 이 화면에만
 * 남아 페이지를 옮겨도 유지되고, [저장]은 서버 값과 달라진 클립만 보낸다.
 */
export function LiveClipManager({
  projectTitle,
  clips,
  requestedPage,
  buildPageHref,
  onSave,
}: {
  projectTitle: string;
  clips: readonly LiveClip[];
  /** 주소의 `page`(1부터). 범위를 벗어나면 가까운 페이지로 맞춘다. */
  requestedPage: number;
  buildPageHref: (page: number) => string;
  /** 바뀐 클립을 저장하고 저장하지 못한 클립을 돌려준다. */
  onSave: (changes: LiveClip[]) => Promise<SaveFailure[]>;
}) {
  const headingId = useId();
  const [pending, setPending] = useState<PendingVisibility>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [failures, setFailures] = useState<SaveFailure[]>([]);
  const savingRef = useRef(false);
  const changes = changedClips(clips, pending);
  const { page, totalPages } = clipPage(requestedPage, clips.length);
  const visible = clips.slice((page - 1) * CLIPS_PER_PAGE, page * CLIPS_PER_PAGE);

  function toggle(clip: LiveClip) {
    setPending((current) => ({ ...current, [clip.highlightId]: !isShownPublic(clip, current) }));
    setNotice("");
    setFailures([]);
  }

  async function save() {
    if (savingRef.current || !changes.length) return;
    savingRef.current = true;
    setSaving(true);
    setNotice("");
    setFailures([]);
    try {
      const failed = await onSave(changes);
      setPending(pendingAfterFailure(failed));
      setFailures(failed);
      if (!failed.length) setNotice("저장했습니다.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <section aria-labelledby={headingId} className="mt-8">
      <div className="flex items-center justify-between gap-3">
        <h2 id={headingId} className="text-title-s min-w-0 break-words">
          {projectTitle}
        </h2>
        <p className="text-caption-s text-text-secondary shrink-0">총 {clips.length} 개</p>
      </div>

      {clips.length ? (
        <>
          <ul className="mt-3 grid gap-3 min-[1200px]:grid-cols-2">
            {visible.map((clip) => (
              <ClipCard
                key={clip.highlightId}
                clip={clip}
                checked={isShownPublic(clip, pending)}
                disabled={saving}
                onToggle={() => toggle(clip)}
              />
            ))}
          </ul>
          {/* Pagination 자체 위 여백(16)과 합쳐 Figma의 목록–페이지 간격 24를 맞춘다. */}
          <div className="pt-2">
            <Pagination currentPage={page} totalPages={totalPages} buildHref={buildPageHref} />
          </div>
          <div className="mt-8 flex flex-col items-end gap-3">
            {notice && (
              <p role="status" className="text-body-s text-text-default">
                {notice}
              </p>
            )}
            {failures.length > 0 && (
              <div role="alert" className="text-body-s text-text-warning w-full">
                <p>
                  숏 클립 {failures.length}개의 공개 여부를 저장하지 못했습니다. 확인한 뒤 다시
                  저장해 주세요.
                </p>
                <ul className="mt-1 list-disc pl-5">
                  {failures.map(({ clip, reason }) => (
                    <li key={clip.highlightId} className="break-words">
                      {clip.title}: {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Button
              size="lg"
              appearance="cta"
              className="w-full min-[1200px]:w-[186px]"
              disabled={!changes.length || saving}
              onClick={() => void save()}
            >
              저장
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center py-16">
          <Image
            alt=""
            src="/images/shared/island.svg"
            width={112}
            height={112}
            className="size-28"
          />
          <p className="text-body-s text-text-secondary mt-10">생성된 숏 클립이 없습니다</p>
        </div>
      )}
    </section>
  );
}

/** Figma 숏 클립 카드(2321:46446). 148px 높이, 92px 썸네일, 오른쪽 아래 공개 토글. */
function ClipCard({
  clip,
  checked,
  disabled,
  onToggle,
}: {
  clip: LiveClip;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  const titleId = useId();
  const labelId = useId();
  return (
    /* Figma 안쪽 선(1px)은 여백 12 안에 겹친다. CSS 테두리는 자리를 차지해 여백을 11로 둔다. */
    <li className="border-w-xs border-border-default bg-layer-surface-default flex h-[148px] min-w-0 gap-3 rounded-xs p-[11px]">
      {/* 다시 받은 목록에서 주소가 바뀌면(재생성 등) 앞선 실패를 잊고 클립 썸네일부터 다시 그린다. */}
      <ClipThumbnail
        key={[clip.thumbnailUrl, clip.clipUrl, clip.liveThumbnailUrl].join("|")}
        clip={clip}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <Badge variant="accent" className="self-start">
          {clip.badge}
        </Badge>
        <div className="flex min-h-0 flex-1 flex-col justify-between">
          <div className="flex flex-col gap-2">
            <h3 id={titleId} className="text-label-l text-text-default truncate" title={clip.title}>
              {clip.title}
            </h3>
            <p className="text-label-m text-text-secondary flex gap-1 font-medium">
              {clip.dateLabel && <span>{clip.dateLabel}생성</span>}
              {clip.dateLabel && clip.durationLabel && <span aria-hidden>·</span>}
              {clip.durationLabel && <span>{clip.durationLabel}초</span>}
            </p>
          </div>
          <div className="flex items-center justify-end gap-3">
            <span id={labelId} className="text-caption-s text-text-default">
              상세페이지에 공개 하기
            </span>
            <VisibilitySwitch
              checked={checked}
              disabled={disabled}
              labelledBy={`${titleId} ${labelId}`}
              onToggle={onToggle}
            />
          </div>
        </div>
      </div>
    </li>
  );
}

type ThumbnailSource = { kind: "image" | "video"; src: string };

/**
 * 클립 썸네일 → 클립 영상의 첫 프레임 → 원본 LIVE 썸네일 순서로 그린다. 없는 것은 건너뛰고
 * 불러오지 못하면 다음 것으로 넘어간다. 모두 없으면 빈 면이다. 클립 썸네일은 AI가 채우기 전까지 비어 있다.
 */
function ClipThumbnail({ clip }: { clip: LiveClip }) {
  const [failedCount, setFailedCount] = useState(0);
  const candidates: { kind: ThumbnailSource["kind"]; src: string | null }[] = [
    { kind: "image", src: clip.thumbnailUrl },
    { kind: "video", src: clip.clipUrl },
    { kind: "image", src: clip.liveThumbnailUrl },
  ];
  const sources = candidates.filter((source): source is ThumbnailSource => Boolean(source.src));
  const source = sources[failedCount];
  const showNext = () => setFailedCount((count) => count + 1);
  return (
    <div className="bg-layer-surface-disabled relative w-[92px] shrink-0 overflow-hidden">
      {source?.kind === "video" ? (
        <video
          key={failedCount}
          aria-hidden
          className="size-full object-cover"
          muted
          playsInline
          preload="metadata"
          src={source.src}
          onError={showNext}
        />
      ) : source ? (
        <Image
          key={failedCount}
          alt=""
          fill
          sizes="92px"
          src={source.src}
          className="object-cover"
          unoptimized={/^https?:\/\//.test(source.src)}
          onError={showNext}
        />
      ) : null}
    </div>
  );
}

/** Figma 토글(38×22, 켜짐 #2947E5·꺼짐 #EEEFF0, 18px 흰 손잡이). 공용 스위치가 없어 이 화면에 둔다. */
function VisibilitySwitch({
  checked,
  disabled,
  labelledBy,
  onToggle,
}: {
  checked: boolean;
  disabled: boolean;
  labelledBy: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      disabled={disabled}
      onClick={onToggle}
      className={`focus-visible:outline-border-primary-live relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed ${
        checked ? "bg-layer-surface-primary-live" : "bg-layer-surface-disabled"
      }`}
    >
      {/* 손잡이 그림자는 Figma drop shadow(x ±2, blur 4, 검정 19%) 그대로다. */}
      <span
        aria-hidden
        className={`bg-text-static-white absolute top-0.5 size-[18px] rounded-full transition-[left] ${
          checked
            ? "left-[18px] shadow-[-2px_0_4px_rgba(0,0,0,0.19)]"
            : "left-0.5 shadow-[2px_0_4px_rgba(0,0,0,0.19)]"
        }`}
      />
    </button>
  );
}
