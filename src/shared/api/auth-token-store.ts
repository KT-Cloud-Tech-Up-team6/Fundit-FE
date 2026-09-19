type TokenListener = (accessToken: string | null) => void;

let revision = 0;
let accessToken: string | null = null;
const listeners = new Set<TokenListener>();

export const authTokenStore = {
  clear() {
    revision++;
    accessToken = null;
    listeners.forEach((listener) => listener(accessToken));
  },
  getRevision() {
    return revision;
  },
  get() {
    return accessToken;
  },
  set(nextAccessToken: string) {
    revision++;
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
