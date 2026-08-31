import type { Preview } from "@storybook/nextjs-vite";

import "../src/app/globals.css";

/**
 * light / dark 는 `globals.css`의 `[data-theme="dark"]` 블록으로 갈린다.
 * 툴바에서 테마를 바꾸면 루트에 `data-theme`를 걸고, read-tokens.ts 가
 * document.documentElement 의 계산된 값을 읽으므로 갤러리가 자동으로 dark 값을 보여준다.
 */
const preview: Preview = {
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
    (Story, context) => {
      const theme = context.globals.theme === "dark" ? "dark" : "light";
      if (typeof document !== "undefined") {
        document.documentElement.dataset.theme = theme;
      }
      return (
        <div
          style={{
            minHeight: "100vh",
            background: "var(--layer-bg)",
            color: "var(--text-default)",
          }}
        >
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
