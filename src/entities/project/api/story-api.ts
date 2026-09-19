import { apiRequest } from "../../../shared/api/client";
import { uploadProjectMedia } from "./media-api";

export function uploadStoryMedia(projectId: string, file: File) {
  const image =
    ["image/jpeg", "image/png", "image/webp"].includes(file.type) &&
    /\.(jpe?g|png|webp)$/i.test(file.name);
  const video = file.type === "video/mp4" && /\.mp4$/i.test(file.name);
  if ((!image && !video) || file.size <= 0 || file.size > (image ? 10 : 100) * 1024 * 1024)
    throw new Error("JPG·PNG·WebP 이미지는 10MB, MP4 영상은 100MB 이하만 업로드할 수 있습니다.");
  return uploadProjectMedia(projectId, file);
}

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
