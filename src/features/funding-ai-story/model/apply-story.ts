import type { QueryClient } from "@tanstack/react-query";
import type { FundingStoryRun, StoryPreviewResponse } from "@/entities/project/api/story-api";

/**
 * 완료 callback 시 BE가 이미 프로젝트 스토리를 저장한다. FE의 "불러오기"는 별도 apply API를
 * 호출하지 않고 현재 에디터가 사용하는 캐시를 BE 확정 결과와 맞춘다.
 */
export async function applyStory(
  cache: QueryClient,
  owner: string,
  projectId: string,
  run: FundingStoryRun,
) {
  if (!["succeeded", "partially_succeeded"].includes(run.status) || !run.result) {
    throw new Error("생성된 스토리가 없습니다.");
  }
  const queryKey = ["seller-project-preview", owner, projectId];
  await cache.cancelQueries({ queryKey, exact: true });
  cache.setQueryData<StoryPreviewResponse>(queryKey, (previous) =>
    previous
      ? {
          ...previous,
          coverImageUrl: run.result?.cover_image_url ?? previous.coverImageUrl,
          introContent: run.result?.intro_content ?? previous.introContent,
        }
      : undefined,
  );
}
