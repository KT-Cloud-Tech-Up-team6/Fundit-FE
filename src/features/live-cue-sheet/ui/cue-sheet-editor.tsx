"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Icon } from "@/shared/components/ui/icon";
import { TextButton } from "@/shared/components/ui/text-button";
import { formatCueTime, type CueScene, type CueSheetType } from "../model/cue-sheet-demo";
import styles from "./cue-sheet.module.css";

/** 원본 구간 목록의 끌기 표시(frequently/dice-6, 14px). 이 화면에서만 쓰여 자산 파일 대신 그린다. */
function GripIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      className="text-text-secondary size-3.5 shrink-0"
    >
      {[2.45, 7, 11.55].flatMap((cy) =>
        [4.73, 9.27].map((cx) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={0.45} />),
      )}
    </svg>
  );
}

/* 원본 XS 버튼(74×28, 13px Medium). 비활성 면은 원본 color=disabled의 #cdced4다. */
const pagerClasses = "text-caption-s! h-7 w-[74px] font-medium disabled:bg-[#cdced4]!";

type CueSheetEditorProps = {
  scenes: CueScene[];
  type: CueSheetType;
  onChange: (scenes: CueScene[]) => void;
  onBack: () => void;
  onRegenerate: () => void;
  onSave: () => void;
  /** 서버 저장이 진행 중이면 저장 버튼을 잠근다. 데모 저장에는 쓰지 않는다. */
  saving?: boolean;
  /** 저장 결과 안내. 편집기를 닫지 않고 그 자리에서 보여준다. */
  notice?: string;
};

export function CueSheetEditor({
  scenes,
  type,
  onChange,
  onBack,
  onRegenerate,
  onSave,
  saving = false,
  notice = "",
}: CueSheetEditorProps) {
  const [selectedId, setSelectedId] = useState(scenes[0].id);
  const [renaming, setRenaming] = useState<string | null>(null);
  const outlineRef = useRef<HTMLTextAreaElement>(null);
  const scriptRef = useRef<HTMLTextAreaElement>(null);
  /* 원본 1256:26879 "기본 수정 모드(자동 텍스트 필드 선택)" — 원본 AISLT_5는 대사 칸에 커서가 있다.
     대사가 없는 시나리오 유형은 개요가 유일한 입력칸이라 개요에 둔다. */
  useEffect(() => {
    (type === "script" ? scriptRef : outlineRef).current?.focus({ preventScroll: true });
  }, [type]);
  const draggedId = useRef<string | null>(null);
  const selectedIndex = Math.max(
    0,
    scenes.findIndex((scene) => scene.id === selectedId),
  );
  const selected = scenes[selectedIndex];
  const start = scenes.slice(0, selectedIndex).reduce((total, scene) => total + scene.duration, 0);
  const total = scenes.reduce((sum, scene) => sum + scene.duration, 0);

  /* 저장 중에는 편집을 막는다. 저장은 시작 시점의 scenes로 PATCH가 이미 나갔으므로,
     그 뒤 고친 내용은 화면에만 남고 서버에는 없는데 "저장했습니다"가 뜬다. 편집 관문이
     이 세 함수뿐이라 여기서 한 번 막으면 텍스트·제목·추가·순서가 모두 걸린다. */
  function updateScene(id: string, patch: Partial<CueScene>) {
    if (saving) return;
    onChange(scenes.map((scene) => (scene.id === id ? { ...scene, ...patch } : scene)));
  }

  function moveScene(id: string, destination: number) {
    if (saving) return;
    const index = scenes.findIndex((scene) => scene.id === id);
    if (index < 0 || destination < 0 || destination >= scenes.length) return;
    const next = [...scenes];
    const [scene] = next.splice(index, 1);
    next.splice(destination, 0, scene);
    onChange(next);
  }

  function addScene() {
    if (saving) return;
    const duration = Math.floor(selected.duration / 2);
    if (!duration) return;
    const scene: CueScene = {
      id:
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `scene-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title: "새 구간",
      duration,
      outline: "",
      script: "",
    };
    const next = scenes.map((item) =>
      item.id === selected.id ? { ...item, duration: item.duration - duration } : item,
    );
    next.splice(selectedIndex + 1, 0, scene);
    onChange(next);
    setSelectedId(scene.id);
    setRenaming(scene.id);
  }

  /* 원본 FL_S_LVS_AISLT_5(1256:26837): 위 26px 줄(예상 방송 시간·전체 재생성), 6px 아래 450px 줄
     (타임라인 196 | 내용 596, 상자 418), 8px 아래 안내 한 줄. 이 묶음(504px)이 500px 칸 가운데라
     위·아래로 2px씩 넘치므로 바깥 간격을 24px 대신 22px로 둔다. */
  return (
    <>
      <div className="mx-auto mt-[22px] max-w-[812px]">
        <div className="flex h-[26px] items-center justify-between gap-4">
          <p className="text-caption-s text-text-secondary font-medium">
            예상 방송 시간 {formatCueTime(total)}
          </p>
          <TextButton
            disabled={saving}
            className="px-2 disabled:opacity-50"
            onClick={() => {
              if (window.confirm("수정한 내용을 초기화하고 큐시트를 다시 생성할까요?"))
                onRegenerate();
            }}
          >
            전체 재생성
          </TextButton>
        </div>
        <div className="mt-1.5 grid h-[450px] grid-cols-[196px_minmax(0,1fr)] items-end gap-5">
          <aside className="flex min-w-0 flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-body-strong">방송 진행 타임라인</h3>
              <Badge variant="accent">총 {scenes.length}구간</Badge>
            </div>
            <div className="border-border-default flex h-[418px] flex-col gap-4 rounded-xs border p-2">
              <ol
                aria-label="방송 구간"
                className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto"
              >
                {scenes.map((scene, index) => {
                  const time = scenes.slice(0, index).reduce((sum, item) => sum + item.duration, 0);
                  const current = scene.id === selected.id;
                  return (
                    <li
                      key={scene.id}
                      draggable={!saving && renaming !== scene.id}
                      onDragStart={(event) => {
                        event.dataTransfer.setData("text/plain", scene.id);
                        event.dataTransfer.effectAllowed = "move";
                        draggedId.current = scene.id;
                      }}
                      onDragEnd={() => {
                        draggedId.current = null;
                      }}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        if (draggedId.current) moveScene(draggedId.current, index);
                        draggedId.current = null;
                      }}
                      className={`shrink-0 rounded-xs border ${current ? "bg-status-accent border-border-primary-live" : "bg-layer-bg border-transparent"}`}
                    >
                      {renaming === scene.id ? (
                        <input
                          autoFocus
                          aria-label="구간 제목"
                          defaultValue={scene.title}
                          className="bg-layer-surface-default text-caption-s w-full rounded-xs border p-2"
                          onBlur={(event) => {
                            updateScene(scene.id, {
                              title: event.target.value.trim() || scene.title,
                            });
                            setRenaming(null);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") event.currentTarget.blur();
                            if (event.key === "Escape") {
                              event.preventDefault();
                              event.stopPropagation();
                              event.currentTarget.value = scene.title;
                              event.currentTarget.blur();
                            }
                          }}
                        />
                      ) : (
                        <button
                          type="button"
                          aria-pressed={current}
                          aria-label={`${index + 1} ${scene.title}, ${formatCueTime(time)}`}
                          className="flex w-full items-center rounded-xs py-2 pr-1 text-left"
                          onClick={() => setSelectedId(scene.id)}
                          onDoubleClick={() => setRenaming(scene.id)}
                          onKeyDown={(event) => {
                            if (event.key === "F2") {
                              event.preventDefault();
                              setRenaming(scene.id);
                            }
                            if (event.altKey && ["ArrowUp", "ArrowDown"].includes(event.key)) {
                              event.preventDefault();
                              moveScene(scene.id, index + (event.key === "ArrowUp" ? -1 : 1));
                            }
                          }}
                        >
                          <GripIcon />
                          <span className="flex min-w-0 flex-1 flex-col px-1">
                            <span className="text-caption-s flex font-medium">
                              {index + 1}
                              <span className="min-w-0 flex-1 px-1 break-words">{scene.title}</span>
                            </span>
                            <span
                              className={`text-label-s font-medium ${current ? "text-text-primary-live" : "text-text-secondary"}`}
                            >
                              {formatCueTime(time)}
                            </span>
                          </span>
                        </button>
                      )}
                    </li>
                  );
                })}
              </ol>
              <Button
                variant="secondary"
                size="md"
                className="text-body-s! h-9 w-full shrink-0 gap-1"
                onClick={addScene}
                disabled={selected.duration < 2}
              >
                추가하기
                <Icon name="plus" className="size-3" />
              </Button>
            </div>
          </aside>
          <section className="flex min-w-0 flex-col gap-2.5">
            <h3 className="flex flex-wrap items-center gap-2">
              <span className="text-body-strong">
                {selectedIndex + 1} {selected.title}
              </span>
              <span className="text-caption-m">
                {formatCueTime(start)}-{formatCueTime(start + selected.duration - 1)}
              </span>
            </h3>
            <div className="bg-layer-bg border-border-default h-[418px] overflow-y-auto rounded-xs border p-4">
              <div className="flex flex-col gap-4">
                <div className="sr-only flex flex-wrap gap-2 focus-within:not-sr-only">
                  <button
                    type="button"
                    className="text-caption-s underline"
                    onClick={() => setRenaming(selected.id)}
                  >
                    제목 수정
                  </button>
                  <button
                    type="button"
                    className="text-caption-s disabled:text-text-disabled underline"
                    disabled={selectedIndex === 0}
                    onClick={() => moveScene(selected.id, selectedIndex - 1)}
                  >
                    위로 이동
                  </button>
                  <button
                    type="button"
                    className="text-caption-s disabled:text-text-disabled underline"
                    disabled={selectedIndex === scenes.length - 1}
                    onClick={() => moveScene(selected.id, selectedIndex + 1)}
                  >
                    아래로 이동
                  </button>
                </div>
                {/* 원본은 개요를 점 목록으로 보이지만, 개요도 저장 대상이고 시나리오 유형에선 유일한
                    입력칸이라 입력칸으로 두고 글자 크기·색만 원본 목록에 맞춘다. */}
                <label className="flex flex-col gap-2">
                  <span className="text-body-s font-medium">진행 개요</span>
                  <textarea
                    ref={outlineRef}
                    rows={3}
                    className={`${styles.outline} text-label-m text-text-secondary block [field-sizing:content] w-full rounded-xs bg-transparent font-medium`}
                    value={selected.outline}
                    onChange={(event) => updateScene(selected.id, { outline: event.target.value })}
                  />
                </label>
                {type === "script" && (
                  <label className="flex flex-col gap-2">
                    <span className="text-body-s font-medium">대사</span>
                    <textarea
                      key={selected.id}
                      ref={scriptRef}
                      className="bg-layer-surface-default border-border-default text-caption-s block [field-sizing:content] min-h-52 w-full rounded-xs border px-3 py-2"
                      value={selected.script}
                      onChange={(event) => updateScene(selected.id, { script: event.target.value })}
                    />
                  </label>
                )}
                <div className="flex justify-end gap-3">
                  <Button
                    variant="secondary"
                    size="xs"
                    className={pagerClasses}
                    disabled={selectedIndex === 0}
                    onClick={() => setSelectedId(scenes[selectedIndex - 1].id)}
                  >
                    이전
                  </Button>
                  <Button
                    size="xs"
                    className={pagerClasses}
                    disabled={selectedIndex === scenes.length - 1}
                    onClick={() => setSelectedId(scenes[selectedIndex + 1].id)}
                  >
                    다음
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </div>
        <p className="text-label-s text-text-secondary mt-2 font-medium">
          드래그하여 순서 변경, 더블클릭으로 제목 수정
        </p>
      </div>
      <div className="mx-auto mt-[22px] flex max-w-[812px] justify-end">
        <div className="flex w-[596px] items-center justify-between gap-4">
          <button
            type="button"
            disabled={saving}
            className={`${styles.secondary} w-36 disabled:opacity-50`}
            onClick={onBack}
          >
            뒤로가기
          </button>
          <p role="status" className="text-caption-s text-text-secondary min-w-0 flex-1 text-right">
            {saving ? "큐시트를 저장하고 있습니다." : notice}
          </p>
          <Button
            variant="primaryLive"
            size="md"
            className="text-body-s! h-10! w-36"
            disabled={saving}
            onClick={onSave}
          >
            저장하기
          </Button>
        </div>
      </div>
    </>
  );
}
