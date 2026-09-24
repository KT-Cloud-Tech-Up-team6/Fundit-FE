"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { ConsoleDialog } from "./console-dialog";
import styles from "./console.module.css";

export type CheckDialog =
  | { kind: "ended" | "check" | "added" }
  | { kind: "detail"; questionId: string }
  | { kind: "originals"; questionId: string; returnTo: "check" | "detail" };

/** LIVE 체크에 올릴 수 있는 답변한 질문. `count`는 원문 수다. */
export type CheckQuestion = { id: string; title: string; count: number; answer: string };

/**
 * 종료 모달 → LIVE 체크(1299:32969~1299:33587) → 추가 완료(1993:43976) 흐름.
 * 선택은 이 컴포넌트가 갖고 있어 원문 보기에서 돌아와도 유지된다. 어느 모달을 띄울지는
 * 바깥이 정한다(데모 초기 화면·실제 종료 응답이 정한다).
 */
export function LiveCheckFlow({
  dialog,
  onDialog,
  questions,
  listFallback,
  renderOriginals,
  publishedIds = [],
  onPublish,
  projectHref,
  onClose,
}: {
  dialog: CheckDialog;
  onDialog: (dialog: CheckDialog) => void;
  questions: CheckQuestion[];
  /** 목록을 아직 받지 못했을 때(불러오는 중·오류) 목록 대신 그린다. */
  listFallback?: ReactNode;
  renderOriginals: (questionId: string) => ReactNode;
  /** 이미 LIVE 체크에 올린 질문. 다시 고르지 못하게 한다. */
  publishedIds?: string[];
  /**
   * 추가하지 못한 id를 돌려준다. `notReady`는 질문 요약이 아직 준비되지 않은 질문, `failed`는 그 밖의
   * 실패다. 둘 다 비어 있으면 추가 완료 모달로 넘어간다.
   */
  onPublish: (ids: string[]) => Promise<{ failed: string[]; notReady: string[] }>;
  /** 상세페이지 LIVE 체크 탭 주소. 모르면 버튼을 비활성화한다. */
  projectHref?: string;
  onClose: () => void;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [unpublished, setUnpublished] = useState({ failed: 0, notReady: 0 });
  /* 추가 요청 중에도 창을 닫을 수 있다. 닫은 뒤 도착한 결과로 창을 다시 열지 않는다. */
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const selectable = questions.filter((q) => !publishedIds.includes(q.id));
  const detail =
    "questionId" in dialog ? questions.find((q) => q.id === dialog.questionId) : undefined;

  async function publish() {
    setPending(true);
    setUnpublished({ failed: 0, notReady: 0 });
    try {
      const { failed, notReady } = await onPublish(selectedIds);
      if (!mounted.current) return;
      if (failed.length || notReady.length) {
        setSelectedIds(selectedIds.filter((id) => failed.includes(id) || notReady.includes(id)));
        setUnpublished({ failed: failed.length, notReady: notReady.length });
        /* 원문 보기에서도 추가할 수 있지만 안내는 질문 목록에만 있다. 목록으로 돌아가 보이게 한다. */
        onDialog({ kind: "check" });
        return;
      }
      setSelectedIds([]);
      onDialog({ kind: "added" });
    } finally {
      setPending(false);
    }
  }

  return (
    <ConsoleDialog
      key={dialog.kind}
      title={
        dialog.kind === "ended"
          ? "라이브 종료"
          : dialog.kind === "added"
            ? "LIVE 체크 추가 완료"
            : "LIVE 체크 추가"
      }
      compact={dialog.kind === "ended" || dialog.kind === "added"}
      onClose={onClose}
      footer={
        dialog.kind === "ended" ? (
          <>
            <Link
              href="/seller/live"
              className={`${styles.secondary} text-body-m flex h-10 flex-1 items-center justify-center`}
            >
              나가기
            </Link>
            <Button
              size="sm"
              variant="primaryLive"
              className="h-10! flex-1"
              onClick={() => onDialog({ kind: "check" })}
            >
              LIVE 체크 추가
            </Button>
          </>
        ) : dialog.kind === "added" ? (
          <>
            <Button size="sm" variant="secondary" className="h-10! flex-1" onClick={onClose}>
              나가기
            </Button>
            <Button
              href={projectHref ?? "#"}
              disabled={!projectHref}
              size="sm"
              variant="primaryLive"
              className="h-10! flex-1"
            >
              상세페이지로
            </Button>
          </>
        ) : dialog.kind === "check" || dialog.kind === "originals" ? (
          <Button
            size="sm"
            variant="primaryLive"
            className="h-10! w-66"
            disabled={!selectedIds.length || pending}
            onClick={() => void publish()}
          >
            LIVE 체크 추가({selectedIds.length})
          </Button>
        ) : (
          <Button size="sm" className="h-10! w-66" onClick={() => onDialog({ kind: "check" })}>
            뒤로
          </Button>
        )
      }
    >
      {dialog.kind === "ended" ? (
        <p className="text-body-m pt-4 text-center">
          라이브가 종료되었습니다.
          <br />
          LIVE 체크에 추가하시겠습니까?
        </p>
      ) : dialog.kind === "added" ? (
        <p className="text-body-m pt-4 text-center">
          선택하신 Q&amp;A 추가가 완료되었습니다.
          <br />
          상세페이지의 LIVE 체크 탭으로 이동하시겠습니까?
        </p>
      ) : dialog.kind === "check" ? (
        <div className="flex min-h-full flex-col gap-3">
          <h3 className="text-body-strong">답변한 질문({questions.length})</h3>
          {listFallback ?? (
            <>
              {!questions.length && <p className="text-body-s">아직 답변한 질문이 없습니다.</p>}
              <ul className="space-y-2">
                {questions.map((q) => {
                  const published = publishedIds.includes(q.id);
                  return (
                    <li
                      key={q.id}
                      className="border-border-default flex overflow-hidden rounded-xs border"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2">
                        <Checkbox
                          aria-label={`${q.title} 게시 선택${published ? " (추가됨)" : ""}`}
                          shape="circle"
                          disabled={published}
                          checked={published || selectedIds.includes(q.id)}
                          onChange={(event) =>
                            setSelectedIds(
                              event.target.checked
                                ? [...selectedIds, q.id]
                                : selectedIds.filter((id) => id !== q.id),
                            )
                          }
                        />
                        <button
                          type="button"
                          className="text-body-s min-w-0 flex-1 text-left"
                          onClick={() => onDialog({ kind: "detail", questionId: q.id })}
                        >
                          {q.title}
                        </button>
                      </div>
                      <button
                        type="button"
                        aria-label={`${q.title} 질문 전체 보기`}
                        className="bg-layer-surface-disabled text-caption-s w-15 shrink-0 underline"
                        onClick={() =>
                          onDialog({ kind: "originals", questionId: q.id, returnTo: "check" })
                        }
                      >
                        {q.count}건
                      </button>
                    </li>
                  );
                })}
              </ul>
              {(unpublished.failed > 0 || unpublished.notReady > 0) && (
                <div role="alert" className="text-body-s text-text-warning">
                  {unpublished.notReady > 0 && (
                    <p>
                      {unpublished.notReady}건은 질문 요약이 아직 준비되지 않았습니다. 잠시 후 다시
                      시도해 주세요.
                    </p>
                  )}
                  {unpublished.failed > 0 && (
                    <p>{unpublished.failed}건을 추가하지 못했습니다. 다시 시도해 주세요.</p>
                  )}
                </div>
              )}
              <Checkbox
                className="mt-auto pt-4"
                shape="circle"
                disabled={!selectable.length}
                checked={selectable.length > 0 && selectedIds.length === selectable.length}
                indeterminate={selectedIds.length > 0 && selectedIds.length < selectable.length}
                onChange={(event) =>
                  setSelectedIds(event.target.checked ? selectable.map((q) => q.id) : [])
                }
              >
                답변 질문 전체 게시
              </Checkbox>
            </>
          )}
        </div>
      ) : (
        detail &&
        (dialog.kind === "originals" ? (
          <div className="flex h-full flex-col">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-body-emphasis">질문 전체 보기 ({detail.count})</h3>
              <button
                type="button"
                className={`${styles.link} text-caption-s text-text-secondary`}
                onClick={() =>
                  onDialog(
                    dialog.returnTo === "check"
                      ? { kind: "check" }
                      : { kind: "detail", questionId: detail.id },
                  )
                }
              >
                돌아가기
              </button>
            </div>
            {renderOriginals(detail.id)}
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-body-strong">대표 질문</h3>
                <button
                  type="button"
                  className={`${styles.link} text-caption-s`}
                  onClick={() =>
                    onDialog({ kind: "originals", questionId: detail.id, returnTo: "detail" })
                  }
                >
                  전체 보기
                </button>
              </div>
              <p className="border-border-default text-body-s rounded-xs border px-4 py-3">
                {detail.title}
              </p>
            </div>
            <div>
              <h3 className="text-body-strong mb-3">보낸 답변</h3>
              <p className="border-border-default text-body-s rounded-xs border px-4 py-3 whitespace-pre-wrap">
                {detail.answer}
              </p>
            </div>
          </div>
        ))
      )}
    </ConsoleDialog>
  );
}
