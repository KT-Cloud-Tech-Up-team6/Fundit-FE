import type { Preview } from "@storybook/nextjs-vite";

import "../src/app/globals.css";

/**
 * light / dark 는 `globals.css`의 `[data-theme="dark"]` 블록으로 갈린다.
 * 스토리가 getComputedStyle 로 토큰 값을 읽으므로, 렌더 전에 루트 attribute 가
 * 반영돼 있어야 한다. beforeEach 는 매 스토리 렌더(글로벌 변경 포함) 직전에 돌아
 * React 렌더 밖에서 attribute 를 걸어준다.
 */
const preview: Preview = {
  async beforeEach({ globals }) {
    document.documentElement.dataset.theme = globals.theme === "dark" ? "dark" : "light";
  },
  parameters: {
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
      <div
        style={{
          minHeight: "100vh",
          background: "var(--layer-bg)",
          color: "var(--text-default)",
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default preview;
