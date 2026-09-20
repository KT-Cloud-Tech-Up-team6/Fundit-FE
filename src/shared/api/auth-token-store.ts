type TokenListener = (accessToken: string | null) => void;

const SESSION_KEY = "fundit.auth.session-generation";
let sharedStorageAvailable = true;
let sessionGeneration: string | null | undefined;
let revision = 0;
let accessToken: string | null = null;
const listeners = new Set<TokenListener>();

function clearToken() {
  revision++;
  accessToken = null;
  listeners.forEach((listener) => listener(accessToken));
}

function syncSession() {
  if (typeof window === "undefined" || !sharedStorageAvailable) return sessionGeneration ?? null;
  try {
    const current = window.localStorage.getItem(SESSION_KEY);
    if (sessionGeneration === undefined) sessionGeneration = current;
    else if (current !== sessionGeneration) {
      sessionGeneration = current;
      clearToken();
    }
  } catch {
    sharedStorageAvailable = false;
    // 저장소 차단 환경에서는 기존 탭 내부 세션 보호를 유지한다.
  }
  return sessionGeneration ?? null;
}

function onStorage(event: StorageEvent) {
  if (event.key === SESSION_KEY || event.key === null) syncSession();
}

export const authTokenStore = {
  clear: clearToken,
  changeSession() {
    syncSession();
    sessionGeneration = crypto.randomUUID();
    try {
      if (sharedStorageAvailable) window.localStorage.setItem(SESSION_KEY, sessionGeneration);
    } catch {
      sharedStorageAvailable = false;
      // 토큰·계정 정보는 저장하지 않으며, 저장소가 없어도 로컬 무효화는 수행한다.
    }
    clearToken();
    return sessionGeneration;
  },
  getSessionGeneration: syncSession,
  getRevision() {
    syncSession();
    return revision;
  },
  get() {
    syncSession();
    return accessToken;
  },
  set(nextAccessToken: string) {
    revision++;
    accessToken = nextAccessToken;
    listeners.forEach((listener) => listener(accessToken));
  },
  subscribe(listener: TokenListener) {
    syncSession();
    if (listeners.size === 0 && typeof window !== "undefined") {
      window.addEventListener("storage", onStorage);
    }
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0 && typeof window !== "undefined") {
        window.removeEventListener("storage", onStorage);
      }
    };
  },
};
