import { apiRequest } from "../../../shared/api/client";

export async function uploadProjectMedia(projectId: string, file: File) {
  const upload = await apiRequest<{ uploadUrl: string; fileUrl: string }>(
    `/api/v1/projects/${projectId}/media/upload-url`,
    {
      auth: true,
      method: "POST",
      body: { fileName: file.name, contentType: file.type, fileSize: file.size },
    },
  );
  const response = await fetch(upload.uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
    credentials: "omit",
  });
  if (!response.ok) throw new Error("파일을 업로드하지 못했습니다.");
  return upload.fileUrl;
}
