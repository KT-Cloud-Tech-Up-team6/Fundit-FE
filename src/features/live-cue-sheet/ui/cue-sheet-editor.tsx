"use client";

import { useRef, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Icon } from "@/shared/components/ui/icon";
import { formatCueTime, type CueScene, type CueSheetType } from "../model/cue-sheet-demo";
import styles from "./cue-sheet.module.css";

type CueSheetEditorProps = {
  scenes: CueScene[];
  type: CueSheetType;
  onChange: (scenes: CueScene[]) => void;
  onBack: () => void;
  onRegenerate: () => void;
  onSave: () => void;
};

export function CueSheetEditor({
  scenes,
  type,
  onChange,
  onBack,
  onRegenerate,
  onSave,
}: CueSheetEditorProps) {
  const [selectedId, setSelectedId] = useState(scenes[0].id);
  const [renaming, setRenaming] = useState<string | null>(null);
  const draggedId = useRef<string | null>(null);
  const selectedIndex = Math.max(
    0,
    scenes.findIndex((scene) => scene.id === selectedId),
  );
  const selected = scenes[selectedIndex];
  const start = scenes.slice(0, selectedIndex).reduce((total, scene) => total + scene.duration, 0);
  const total = scenes.reduce((sum, scene) => sum + scene.duration, 0);

  function updateScene(id: string, patch: Partial<CueScene>) {
    onChange(scenes.map((scene) => (scene.id === id ? { ...scene, ...patch } : scene)));
  }

  function moveScene(id: string, destination: number) {
    const index = scenes.findIndex((scene) => scene.id === id);
    if (index < 0 || destination < 0 || destination >= scenes.length) return;
    const next = [...scenes];
    const [scene] = next.splice(index, 1);
    next.splice(destination, 0, scene);
    onChange(next);
  }

  function addScene() {
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

  return (
    <div className={styles.body}>
      <aside className="relative min-w-0">
        <p className="text-caption-s mb-3 md:absolute md:-top-9">
          예상 방송 시간 {formatCueTime(total)}
        </p>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-body-strong">방송 진행 타임라인</h3>
          <span className="bg-layer-surface-disabled text-caption-strong rounded-xs px-2 py-1">
            총 {scenes.length}구간
          </span>
        </div>
        <div className={`${styles.panel} flex flex-col gap-3 p-2`}>
          <ol aria-label="방송 구간" className="min-h-0 flex-1 space-y-2 overflow-y-auto">
            {scenes.map((scene, index) => {
              const time = scenes.slice(0, index).reduce((sum, item) => sum + item.duration, 0);
              return (
                <li
                  key={scene.id}
                  draggable={renaming !== scene.id}
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
                  className={`rounded-xs ${scene.id === selected.id ? "bg-border-default" : "bg-layer-surface-disabled"}`}
                >
                  {renaming === scene.id ? (
                    <input
                      autoFocus
                      aria-label="구간 제목"
                      defaultValue={scene.title}
                      className="bg-layer-surface-default text-body-s w-full rounded-xs border p-2"
                      onBlur={(event) => {
                        updateScene(scene.id, { title: event.target.value.trim() || scene.title });
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
                      aria-pressed={scene.id === selected.id}
                      aria-label={`${index + 1} ${scene.title}, ${formatCueTime(time)}`}
                      className="text-caption-s flex w-full items-center gap-1 rounded-xs p-2 text-left"
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
                      <span
                        aria-hidden
                        className="size-3 shrink-0 bg-current [mask-image:url('/images/live-cue-sheet/drag.svg')] [mask-size:contain] [mask-repeat:no-repeat]"
                      />
                      <span className="min-w-0">
                        <span className="block break-words">
                          {index + 1} {scene.title}
                        </span>
                        <span className="text-caption-strong">{formatCueTime(time)}</span>
                      </span>
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
          <button
            type="button"
            className={styles.secondary}
            onClick={addScene}
            disabled={selected.duration < 2}
          >
            추가하기 +
          </button>
        </div>
        <p className="text-caption-s text-text-secondary mt-2">
          드래그하여 순서 변경
          <br />
          더블클릭 또는 F2로 제목 수정
        </p>
      </aside>
      <section className="relative min-w-0">
        <button
          type="button"
          className="text-caption-s text-text-secondary mb-3 flex items-center gap-1 underline md:absolute md:-top-9 md:right-0"
          onClick={() => {
            if (window.confirm("수정한 내용을 초기화하고 큐시트를 다시 생성할까요?"))
              onRegenerate();
          }}
        >
          전체 재생성 <Icon name="swap" className="size-3.5" />
        </button>
        <h3 className="text-body-strong mb-2 flex flex-wrap items-center gap-2">
          {selectedIndex + 1} {selected.title}
          <span className="text-caption-s font-normal">
            {formatCueTime(start)}–{formatCueTime(start + selected.duration - 1)}
          </span>
        </h3>
        <div className={`${styles.panel} bg-layer-surface-disabled overflow-y-auto p-4`}>
          <div className="mb-3 flex flex-wrap gap-2">
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
          <label className="text-body-s block">
            진행 개요
            <textarea
              className="bg-layer-surface-default border-border-default mt-2 block min-h-24 w-full rounded-xs border p-3"
              value={selected.outline}
              onChange={(event) => updateScene(selected.id, { outline: event.target.value })}
            />
          </label>
          {type === "script" && (
            <label className="text-body-s mt-4 block">
              대사
              <textarea
                key={selected.id}
                className="bg-layer-surface-default border-border-default mt-2 block min-h-52 w-full rounded-xs border p-3"
                value={selected.script}
                onChange={(event) => updateScene(selected.id, { script: event.target.value })}
              />
            </label>
          )}
          <div className="mt-4 flex justify-between">
            <button
              type="button"
              className={styles.secondary}
              disabled={selectedIndex === 0}
              onClick={() => setSelectedId(scenes[selectedIndex - 1].id)}
            >
              이전
            </button>
            <button
              type="button"
              className={styles.secondary}
              disabled={selectedIndex === scenes.length - 1}
              onClick={() => setSelectedId(scenes[selectedIndex + 1].id)}
            >
              다음
            </button>
          </div>
        </div>
        <div className="mt-5 flex justify-between gap-4">
          <button type="button" className={`${styles.secondary} w-36`} onClick={onBack}>
            뒤로가기
          </button>
          <Button size="md" className="text-body-s! h-10! w-36" onClick={onSave}>
            저장하기
          </Button>
        </div>
      </section>
    </div>
  );
}
