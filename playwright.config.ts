import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  // ponytail: next dev는 라우트별 최초 컴파일이 동시 요청에서 서로를 블록해 병렬 워커가 불안정하다.
  // 스펙당 수 초짜리 소규모 스위트라 직렬 실행 비용은 감수할 만하다.
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      NEXT_PUBLIC_MSW_ENABLED: "true",
      NEXT_PUBLIC_TOSS_CLIENT_KEY: "",
    },
  },
});
