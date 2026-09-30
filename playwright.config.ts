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
    // 이미 떠 있는 dev 서버는 MSW·빈 Toss 키 env가 적용돼 있지 않아 실제 BE·Toss로 나갈 수 있다.
    // 항상 이 설정의 서버를 새로 띄우고, 3000번 포트가 사용 중이면 실행을 멈춘다.
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      NEXT_PUBLIC_MSW_ENABLED: "true",
      NEXT_PUBLIC_TOSS_CLIENT_KEY: "",
      // .env.local의 실제 client ID가 e2e를 실제 제공자로 보내지 않게 비운다(목업 인가 코드를 쓴다).
      NEXT_PUBLIC_KAKAO_CLIENT_ID: "",
      NEXT_PUBLIC_GOOGLE_CLIENT_ID: "",
    },
  },
});
