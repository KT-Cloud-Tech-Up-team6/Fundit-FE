import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

/* 이 컴포넌트는 CSS 모듈을 가져오는데 `tsx --test`에는 CSS 로더가 없다. 클래스명은 이 테스트가 보는
   대상이 아니라 빈 객체로 세운다. 컴포넌트는 등록 뒤에 불러와야 해서 동적 import다.
   ponytail: 컴포넌트 테스트가 이 하나뿐이라 지역 shim으로 둔다. 두 번째가 생기면 공용으로 뺀다. */
createRequire(import.meta.url).extensions[".css"] = (module) => {
  module.exports = {};
};
const { BuyerProjectDetail } = await import("./buyer-project-detail.tsx");
const { AuthContext } = await import("@/providers/auth-provider");

/* 헤더의 HeaderAuthLink가 useAuth를 읽는다. AuthProvider 전체(QueryClientProvider·Next 라우터)
   없이 렌더만 보는 테스트라 컨텍스트만 최소로 채운다(`buyer-refunds.test.mjs`와 같다). */
const authValue = {
  authenticate: async () => {},
  clearSession: () => {},
  logout: () => {},
  state: { accessToken: null, status: "checking", user: null },
};

/* 하트는 네 갈래다 — 조회 실패(재시도), 찜 연동(서버 값), 요청 중(진행 표시), 데모(로컬 상태).
   정적 렌더라 클릭은 보지 않고, 갈래마다 달라지는 접근성 속성과 라벨만 잠근다
   (`buyer-refunds.test.mjs`와 같은 방식). */
const heart = (props) => {
  const html = renderToStaticMarkup(
    createElement(
      AuthContext.Provider,
      { value: authValue },
      createElement(BuyerProjectDetail, {
        projectId: "11111111-1111-4111-8111-111111111111",
        activeTab: "story",
        ...props,
      }),
    ),
  );
  const match = html.match(/<button[^>]*aria-label="[^"]*찜[^"]*"[^>]*>.*?<\/button>/s);
  assert.ok(match, "찜 버튼을 찾지 못했다");
  return match[0];
};

const wish = {
  wished: false,
  failed: false,
  disabled: false,
  retry: () => {},
  toggle: () => Promise.resolve(),
};

test("찜 상태 조회에 실패하면 재시도임을 라벨과 본문으로 알린다", () => {
  const button = heart({ wish: { ...wish, failed: true } });
  assert.match(button, /aria-label="찜 상태를 불러오지 못했습니다\. 다시 시도"/);
  assert.match(button, /다시 시도<\/span>/);
  /* 실패는 찜 여부를 모르는 상태다. 눌리지 않은 것처럼 보이지 않게 aria-pressed를 비운다. */
  assert.doesNotMatch(button, /aria-pressed/);
});

test("찜 상태를 받으면 서버 값을 aria-pressed로 반영한다", () => {
  assert.match(heart({ wish: { ...wish, wished: true } }), /aria-pressed="true"/);
  assert.match(heart({ wish }), /aria-pressed="false"/);
  for (const button of [heart({ wish: { ...wish, wished: true } }), heart({ wish })]) {
    assert.match(button, /aria-label="프로젝트 찜"/);
    assert.doesNotMatch(button, /다시 시도/);
  }
});

test("요청 중에는 버튼을 막고 진행 중임을 알린다", () => {
  const button = heart({ wish: { ...wish, wished: true, disabled: true } });
  assert.match(button, /aria-busy="true"/);
  assert.match(button, /disabled/);
  /* 낙관적 표시(`buyer-project-api`)가 넘긴 값이 그대로 보여야 탭이 먹힌 걸 알 수 있다. */
  assert.match(button, /aria-pressed="true"/);
});

test("조회 실패에는 진행 중 표시를 붙이지 않는다", () => {
  assert.doesNotMatch(heart({ wish: { ...wish, failed: true, disabled: true } }), /aria-busy/);
});

test("찜을 연동하지 않은 데모 화면은 로컬 상태로 시작하고 진행 중 표시가 없다", () => {
  const button = heart({});
  assert.match(button, /aria-pressed="false"/);
  assert.match(button, /aria-label="프로젝트 찜"/);
  assert.doesNotMatch(button, /aria-busy/);
});
