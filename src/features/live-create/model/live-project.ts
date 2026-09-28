import type { ProjectListItem, ProjectPreview } from "@/entities/project/api/seller-project-api";

/**
 * LIVE 생성 화면의 프로젝트 요약 카드 값(FL_S_LV_CREATE_5·8).
 *
 * 숫자·기간이 `null`을 허용하는 이유: 프로젝트 하나를 id로 읽는
 * `GET /api/v1/projects/{id}/preview`에는 펀딩 기간·참여자 수·현재 모금액이 없다. 0으로 채우면
 * 카드가 사실과 다른 말을 하므로 자리는 두고 값이 없다고 적는다. 목록 응답에는 모두 있다.
 */
export type LiveProjectSummary = {
  id: string;
  title: string;
  category: string;
  period: string;
  participantCount: number | null;
  currentAmount: number | null;
  goalAmount: number | null;
  image: string;
};

/* Figma 카드(FL_S_LV_CREATE_5)는 기간을 `2026.07.01 - 2026.08.12`로 적는다. 좁은 카드 한 줄에
   카테고리·기간·참여자를 함께 두므로 이 짧은 형식을 쓴다. 날짜는 한국 시각 기준이다. */
const dotDate = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const toDotDate = (value: string | null) =>
  value ? dotDate.format(new Date(value)).replaceAll("-", ".") : "미정";

/** 판매자 프로젝트 목록 응답 → 요약 카드. */
export function fromProjectListItem(item: ProjectListItem): LiveProjectSummary {
  return {
    id: item.projectId,
    title: item.title || "제목 없음",
    category: item.categoryMajor ?? "",
    period: `${toDotDate(item.fundingStartAt)} - ${toDotDate(item.fundingDeadline)}`,
    participantCount: item.participantCount,
    currentAmount: item.currentAmount,
    goalAmount: item.goalAmount,
    image: item.thumbnailUrl ?? "",
  };
}

/** 소유자 미리보기 응답 → 요약 카드. 기간·참여자·모금액은 응답에 없어 비운다. */
export function fromProjectPreview(projectId: string, preview: ProjectPreview): LiveProjectSummary {
  return {
    id: projectId,
    title: preview.title || "제목 없음",
    category: preview.categoryMajor ?? "",
    period: "",
    participantCount: null,
    currentAmount: null,
    goalAmount: preview.goalAmount,
    image: preview.coverImageUrl ?? "",
  };
}

/** 원본은 카테고리를 먼저 고르고 그 카테고리의 프로젝트만 보인다(FL_S_LV_CREATE_5). */
export const projectsInCategory = (items: readonly ProjectListItem[], category: string) =>
  items.filter((item) => item.categoryMajor === category);
