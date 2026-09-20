import type { QueryClient } from "@tanstack/react-query";
import {
  applyFundingStory,
  type FundingStorySession,
  type IntroBlock,
  type StoryPreviewResponse,
} from "@/entities/project/api/story-api";

export async function applyStory(
  cache: QueryClient,
  owner: string,
  projectId: string,
  session: FundingStorySession,
) {
  if (!session.result) throw new Error("생성된 스토리가 없습니다.");
  const introContent = session.result.sections.flatMap((section): IntroBlock[] => [
    { type: "TEXT", value: section.body },
    ...(section.images ?? []).map((value): IntroBlock => ({ type: "IMAGE", value })),
  ]);
  const queryKey = ["seller-project-preview", owner, projectId];
  await cache.cancelQueries({ queryKey, exact: true });
  await applyFundingStory(session.sessionId);
  cache.setQueryData<StoryPreviewResponse>(queryKey, (previous) =>
    previous ? { ...previous, introContent } : undefined,
  );
}
