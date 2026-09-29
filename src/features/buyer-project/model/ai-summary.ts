import type { ProjectPageSummary } from "@/entities/project/api/buyer-project-api";

/** AI 프로젝트 요약 항목. 체크 옆 제목은 headline, 그 아래 본문은 description이다(#407). */
export type AiSummaryItem = { title: string; body: string };

/**
 * 카드에 보일 요약 상태. 생성이 끝났으면 항목을, 생성 중이면 자리를 잡아 두고, 요약이 없거나 실패했으면
 * (BE가 `pageSummary`를 뺀다) 카드를 그리지 않는다(자체 판단 135).
 */
export type AiSummaryState = { status: "ready"; items: AiSummaryItem[] } | { status: "generating" };

/** 생성 중일 때 상세를 다시 받는 간격. 화면이 보이는 동안만 받는다. */
export const AI_SUMMARY_REFETCH_MS = 10_000;

/* Figma 카드(2107:70404)의 두 자리를 WHAT → WHY 순서로 채운다. */
const ROLE_ORDER = ["WHAT", "WHY"];

export const isAiSummaryGenerating = (summary: ProjectPageSummary | null | undefined) =>
  summary?.status === "GENERATING";

export function aiSummaryState(
  summary: ProjectPageSummary | null | undefined,
): AiSummaryState | null {
  if (isAiSummaryGenerating(summary)) return { status: "generating" };
  if (summary?.status !== "SUCCEEDED") return null;
  const items = ROLE_ORDER.flatMap((role) => {
    const section = summary.sections?.find((item) => item.role === role);
    const title = section?.headline?.trim();
    const body = section?.description?.trim();
    return title && body ? [{ title, body }] : [];
  });
  /* BE도 WHAT·WHY가 모두 없으면 실패로 닫는다. 한쪽만 온 응답은 완료로 보지 않는다. */
  return items.length === ROLE_ORDER.length ? { status: "ready", items } : null;
}
