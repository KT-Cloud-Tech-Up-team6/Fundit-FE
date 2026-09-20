import { apiRequest } from "../../../shared/api/client";

export type StoryPreviewResponse = {
  projectId: string;
  title: string | null;
  coverImageUrl: string | null;
  introContent: IntroBlock[];
};
export function getStoryPreview(projectId: string, signal?: AbortSignal) {
  return apiRequest<StoryPreviewResponse>(`/api/v1/projects/${projectId}/preview`, {
    auth: true,
    signal,
  });
}

export type IntroBlock = { type: "TEXT" | "IMAGE" | "VIDEO_URL"; value: string };
export type StoryRequest = { title: string; coverImageUrl?: string; introContent: IntroBlock[] };
export function saveProjectStory(projectId: string, body: StoryRequest) {
  return apiRequest<{ projectId: string; updatedAt: string }>(
    `/api/v1/projects/${projectId}/story`,
    { auth: true, method: "PATCH", body },
  );
}
export type FundingStorySession = {
  sessionId: string;
  status: string;
  additionalQuestions: { questionId: string; question: string }[];
  result: null | {
    sections: { type: string; title: string; body: string; images: string[] }[];
    warnings: { field: string; reason: string }[];
  };
};
export async function generateFundingStory(projectId: string, productDescription: string) {
  const created = await apiRequest<{ sessionId: string; status: string }>(
    `/api/v1/projects/${projectId}/ai/funding-story/sessions`,
    { auth: true, method: "POST", body: { productDescription } },
  );
  return apiRequest<FundingStorySession>(`/api/v1/ai/funding-story/sessions/${created.sessionId}`, {
    auth: true,
  });
}
export function applyFundingStory(sessionId: string) {
  return apiRequest<{ projectId: string; updatedAt: string }>(
    `/api/v1/ai/funding-story/sessions/${sessionId}/apply`,
    { auth: true, method: "PATCH", body: { mode: "OVERWRITE" } },
  );
}
