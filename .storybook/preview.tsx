import type { Preview } from "@storybook/nextjs-vite";

import { AuthFlowProvider } from "../src/features/auth/model/auth-flow-context";
import { startMockWorker } from "../src/mocks/browser";
import { AppProviders } from "../src/providers/app-providers";
import "../src/app/globals.css";

/**
 * light / dark 는 `globals.css`의 `[data-theme="dark"]` 블록으로 갈린다.
 * 스토리가 getComputedStyle 로 토큰 값을 읽으므로, 렌더 전에 루트 attribute 가
 * 반영돼 있어야 한다. beforeEach 는 매 스토리 렌더(글로벌 변경 포함) 직전에 돌아
 * React 렌더 밖에서 attribute 를 걸어준다.
 */
const preview: Preview = {
  /* Storybook은 loaders를 기다린 뒤 렌더하고, 렌더 직후 play를 실행한다. 워커를 여기서 먼저
     켜 두면 MswProvider가 첫 렌더부터 스토리를 그려 play가 빈 화면에서 돌지 않는다. */
  loaders: [
    async () => {
      await startMockWorker();
      return {};
    },
  ],
  async beforeEach({ globals }) {
    document.documentElement.dataset.theme = globals.theme === "dark" ? "dark" : "light";
  },
  parameters: {
    /* 아래 decorators의 AppProviders가 AuthProvider를 마운트하고, AuthProvider는 useRouter를 쓴다.
       app router 목킹이 없으면 "invariant expected app router to be mounted"로 스토리가
       렌더되지 않는다. 스토리마다 붙이면 빠뜨린 파일이 조용히 깨지므로 여기서 한 번만 켠다.
       개별 스토리가 parameters.nextjs로 덮어쓰는 것은 그대로 동작한다. */
    nextjs: { appDirectory: true },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo",
    },
  },
  initialGlobals: {
    theme: "light",
  },
  globalTypes: {
    theme: {
      description: "디자인 토큰 테마",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story) => (
      <AppProviders mswForceEnabled>
        <AuthFlowProvider>
          <div
            style={{
              minHeight: "100vh",
              background: "var(--layer-bg)",
              color: "var(--text-default)",
            }}
          >
            <Story />
          </div>
        </AuthFlowProvider>
      </AppProviders>
    ),
  ],
};

export default preview;
