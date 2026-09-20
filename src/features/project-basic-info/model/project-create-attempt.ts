import { createProject } from "@/entities/project/api/seller-project-api";
import { ApiError } from "@/shared/api/api-error";

export class ProjectCreationUncertainError extends Error {
  constructor() {
    super(
      "프로젝트 생성 결과를 확인하지 못해 추가 생성을 중단했습니다. 내 프로젝트 목록에서 생성 여부를 먼저 확인해주세요.",
    );
  }
}

export function projectAttemptKey(owner: string) {
  return `fundit-project-attempt:${owner}`;
}

export async function createProjectOnce(
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem">,
  owner: string,
): Promise<string> {
  const key = projectAttemptKey(owner);
  const previous = storage.getItem(key);
  if (previous === "pending") throw new ProjectCreationUncertainError();
  if (previous) return previous;
  storage.setItem(key, "pending");
  try {
    const response = await createProject();
    if (!response?.projectId) throw new ProjectCreationUncertainError();
    storage.setItem(key, response.projectId);
    return response.projectId;
  } catch (error) {
    if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
      storage.removeItem(key);
      throw error;
    }
    throw new ProjectCreationUncertainError();
  }
}
