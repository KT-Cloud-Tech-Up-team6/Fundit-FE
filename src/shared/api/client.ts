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
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestInit,
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: "include",
    headers: makeHeaders(options, auth ? authTokenStore.get() : null),
  });

  if (auth && response.status === 401 && !retried) {
    await refreshOnce();
    return request(path, options, true);
  }

  return parseResponse<T>(response);
}

/* 어느 한 호출자의 AbortSignal에 묶으면, 그 호출자가 취소될 때 같이 기다리던 다른
   요청들의 refresh까지 함께 끊긴다. refresh 자체는 누구의 취소와도 무관하게 끝까지 간다. */
async function refreshOnce(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/api/v1/auth/token/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then((response) => parseResponse<{ accessToken: string }>(response))
      .then(({ accessToken }) => {
        authTokenStore.set(accessToken);
        return accessToken;
      })
      .catch((error: unknown) => {
        /* 네트워크 오류·타임아웃·5xx까지 세션 실패로 취급하면 일시적 장애로 강제 로그아웃된다.
           Refresh Token 자체가 무효하다고 서버가 확인한 401에서만 지운다. */
        if (error instanceof ApiError && error.status === 401) authTokenStore.clear();
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
