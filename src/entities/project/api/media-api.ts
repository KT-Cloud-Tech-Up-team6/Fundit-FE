import { apiRequest } from "../../../shared/api/client";
import { ApiError } from "../../../shared/api/api-error";

export class ProjectMediaValidationError extends Error {}
export type ProjectMediaKind = "image" | "video" | "media";

export function validateProjectMedia(file: File, kind: ProjectMediaKind = "media") {
  const image =
    kind !== "video" &&
    ((file.type === "image/jpeg" && /\.jpe?g$/i.test(file.name)) ||
      (file.type === "image/png" && /\.png$/i.test(file.name)) ||
      (file.type === "image/webp" && /\.webp$/i.test(file.name)));
  const video = kind !== "image" && file.type === "video/mp4" && /\.mp4$/i.test(file.name);
  if ((!image && !video) || file.size <= 0 || file.size > (image ? 10 : 100) * 1024 * 1024) {
    throw new ProjectMediaValidationError(
      kind === "image"
        ? "JPG·PNG·WebP 이미지는 10MB 이하만 업로드할 수 있습니다."
        : kind === "video"
          ? "MP4 영상은 100MB 이하만 업로드할 수 있습니다."
          : "JPG·PNG·WebP 이미지는 10MB, MP4 영상은 100MB 이하만 업로드할 수 있습니다.",
    );
  }
}

export async function uploadProjectMedia(
  projectId: string,
  file: File,
  kind: ProjectMediaKind = "media",
) {
  validateProjectMedia(file, kind);
  let upload: { uploadUrl: string; fileUrl: string };
  try {
    upload = await apiRequest<{ uploadUrl: string; fileUrl: string }>(
      `/api/v1/projects/${projectId}/media/upload-url`,
      {
        auth: true,
        method: "POST",
        body: { fileName: file.name, contentType: file.type, fileSize: file.size },
      },
    );
  } catch (error) {
    if (error instanceof ApiError && error.code === "UNSUPPORTED_MEDIA_TYPE") {
      throw new ProjectMediaValidationError(
        "지원하지 않는 파일 형식입니다. JPG·PNG·WebP 이미지 또는 MP4 영상을 선택해주세요.",
      );
    }
    if (error instanceof ApiError && error.code === "MEDIA_TOO_LARGE") {
      throw new ProjectMediaValidationError(
        "파일 용량이 너무 큽니다. 이미지는 10MB, 영상은 100MB 이하로 선택해주세요.",
      );
    }
    throw error;
  }
  const response = await fetch(upload.uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
    credentials: "omit",
  });
  if (!response.ok) throw new Error("파일을 업로드하지 못했습니다.");
  return upload.fileUrl;
}
