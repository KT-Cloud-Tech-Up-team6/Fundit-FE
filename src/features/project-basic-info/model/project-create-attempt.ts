import { createProject } from "@/entities/project/api/seller-project-api";
import { ApiError } from "@/shared/api/api-error";

export class ProjectCreationUncertainError extends Error {
  constructor(
    message = "프로젝트 생성 결과를 확인하지 못했습니다. 다시 저장하면 같은 요청으로 이어서 확인합니다.",
  ) {
    super(message);
  }
}

type AttemptStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** 프로젝트 생성 시도 하나. `projectId`가 없으면 서버가 만들었는지 아직 모른다. */
type Attempt = { key: string; projectId?: string };

export function projectAttemptKey(owner: string) {
  return `fundit-project-create:${owner}`;
}

export async function createProjectOnce(storage: AttemptStorage, owner: string): Promise<string> {
  const storageKey = projectAttemptKey(owner);
  const previous = storage.getItem(storageKey);
  const attempt: Attempt = previous ? JSON.parse(previous) : { key: crypto.randomUUID() };
  if (attempt.projectId) return attempt.projectId;
  /* 요청 전에 키를 남겨야 응답 유실·새로고침 뒤에도 같은 키로 서버가 만든 프로젝트를 되찾는다.
     본문이 없는 생성이라 같은 키를 다시 써도 거절되지 않으므로 시도가 끝날 때까지 키를 버리지 않는다. */
  storage.setItem(storageKey, JSON.stringify(attempt));
  let projectId: string | undefined;
  try {
    projectId = (await createProject(attempt.key))?.projectId;
  } catch (error) {
    if (error instanceof ApiError && error.code === "CONFLICT")
      throw new ProjectCreationUncertainError(
        "같은 프로젝트 생성을 처리하고 있습니다. 잠시 후 다시 저장해주세요.",
      );
    // 서버가 거절을 확정한 4xx는 그대로 알린다. 네트워크·5xx·응답 파싱 실패는 결과를 모른다.
    if (error instanceof ApiError && error.status >= 400 && error.status < 500) throw error;
    throw new ProjectCreationUncertainError();
  }
  if (!projectId) throw new ProjectCreationUncertainError();
  storage.setItem(storageKey, JSON.stringify({ ...attempt, projectId }));
  return projectId;
}
