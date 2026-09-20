import { ApiError } from "./api-error";
import { authTokenStore } from "./auth-token-store";

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  auth?: boolean;
  body?: unknown;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

let refreshPromise: Promise<string> | null = null;

function makeHeaders(options: ApiRequestOptions, accessToken?: string | null) {
  const headers = new Headers(options.headers);

  if (options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  return headers;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let payload: unknown;

  try {
    payload = text ? JSON.parse(text) : undefined;
  } catch {
    if (response.ok) {
      throw new ApiError({
        code: "RESPONSE_PARSE_ERROR",
        message: "서버 응답을 읽지 못했습니다.",
        status: response.status,
      });
    }
  }

  if (!response.ok) {
    const error = payload as
      Partial<{ code: string; detail: unknown; message: string }> | undefined;
    throw new ApiError({
      code: error?.code ?? "HTTP_ERROR",
      detail: error?.detail,
      message: error?.message ?? `요청에 실패했습니다. (${response.status})`,
      status: response.status,
    });
  }

  return payload as T;
}

async function request<T>(path: string, options: ApiRequestOptions, retried: boolean): Promise<T> {
  const { auth = false, body, ...requestInit } = options;
  const generation = authTokenStore.getSessionGeneration();
  const assertSession = () => {
    if (auth && authTokenStore.getSessionGeneration() !== generation) {
      throw new DOMException("Session changed", "AbortError");
    }
  };
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestInit,
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: "include",
    headers: makeHeaders(options, auth ? authTokenStore.get() : null),
  });

  assertSession();
  if (auth && response.status === 401 && !retried) {
    await refreshOnce();
    assertSession();
    return request(path, options, true);
  }

  const result = await parseResponse<T>(response);
  assertSession();
  return result;
}

/* 어느 한 호출자의 AbortSignal에 묶으면, 그 호출자가 취소될 때 같이 기다리던 다른
   요청들의 refresh까지 함께 끊긴다. refresh 자체는 누구의 취소와도 무관하게 끝까지 간다. */
export async function refreshOnce(): Promise<string> {
  if (!refreshPromise) {
    const revision = authTokenStore.getRevision();
    const refresh = async () => {
      if (authTokenStore.getRevision() !== revision) {
        throw new DOMException("Session changed", "AbortError");
      }
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/token/refresh`, {
        method: "POST",
        credentials: "include",
      });
      const { accessToken } = await parseResponse<{ accessToken: string }>(response);
      if (authTokenStore.getRevision() !== revision) {
        throw new DOMException("Session changed", "AbortError");
      }
      authTokenStore.set(accessToken);
      return accessToken;
    };
    // 쿠키를 바꾸는 로그인·가입과 refresh 모두 같은 origin 잠금을 사용한다.
    refreshPromise = withAuthLock(refresh)
      .catch((error: unknown) => {
        /* 네트워크 오류·타임아웃·5xx까지 세션 실패로 취급하면 일시적 장애로 강제 로그아웃된다.
           Refresh Token 자체가 무효하다고 서버가 확인한 401에서만 지운다. */
        if (
          authTokenStore.getRevision() === revision &&
          error instanceof ApiError &&
          error.status === 401
        ) {
          authTokenStore.clear();
        }
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export function apiRequest<T>(path: string, options: ApiRequestOptions = {}) {
  return request<T>(path, options, false);
}

async function withAuthLock<T>(run: () => Promise<T>): Promise<T> {
  const locks = globalThis.navigator?.locks;
  return await (locks ? locks.request("fundit-auth-refresh", run) : run());
}

// 쿠키가 바뀌기 전에 이전 세션을 무효화하고, 결과 저장까지 refresh와 직렬화한다.
export function apiSessionRequest<T extends object>(
  path: string,
  options: ApiRequestOptions,
): Promise<T> {
  return withAuthLock(async () => {
    options.signal?.throwIfAborted();
    const generation = authTokenStore.changeSession();
    const result = await apiRequest<T>(path, options);
    if (authTokenStore.getSessionGeneration() !== generation) {
      throw new DOMException("Session changed", "AbortError");
    }
    if ("accessToken" in result && typeof result.accessToken === "string") {
      authTokenStore.set(result.accessToken);
    }
    return result;
  });
}
