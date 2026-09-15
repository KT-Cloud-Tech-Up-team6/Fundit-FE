type TokenListener = (accessToken: string | null) => void;

let accessToken: string | null = null;
const listeners = new Set<TokenListener>();

export const authTokenStore = {
  clear() {
    accessToken = null;
    listeners.forEach((listener) => listener(accessToken));
  },
  get() {
    return accessToken;
  },
  set(nextAccessToken: string) {
    accessToken = nextAccessToken;
    listeners.forEach((listener) => listener(accessToken));
  },
  subscribe(listener: TokenListener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
