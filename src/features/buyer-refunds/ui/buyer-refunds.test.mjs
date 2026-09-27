import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AuthContext } from "@/providers/auth-provider";
import { refundSummariesDemo } from "../model/refunds-demo.ts";
import { toRefundEntry } from "../model/refund-history.ts";
import { BuyerRefunds } from "./buyer-refunds.tsx";

const entries = refundSummariesDemo.map(toRefundEntry);
const [delayed, cancelled, , exchange, , rejected, degraded] = entries;

/* BuyerRefunds는 BuyerAccountScreen을 통해 HeaderAuthLink(useAuth 사용)를 그린다. 이 파일은
   AuthProvider 전체(QueryClientProvider·Next 라우터 필요) 없이 렌더만 확인하는 가벼운 테스트라,
   useAuth()가 읽는 컨텍스트만 최소로 채운다. */
const authValue = {
  authenticate: async () => {},
  clearSession: () => {},
  logout: () => {},
  state: { accessToken: null, status: "checking", user: null },
};
const render = (list, props = {}) =>
  renderToStaticMarkup(
    createElement(
      AuthContext.Provider,
      { value: authValue },
      createElement(BuyerRefunds, {
        entries: list,
        total: list.length,
        type: "all",
        onTypeChange: () => {},
        inProgress: false,
        onInProgressChange: () => {},
        ...props,
      }),
    ),
  );

test("제목은 09-25 화면 헤더의 취소/반품/교환 내역이다", () => {
  const html = render([cancelled]);
  assert.match(html, /<h1[^>]*>취소\/반품\/교환 내역<\/h1>/);
  assert.match(render([]), /취소\/반품\/교환 내역이 없습니다\./);
});

test("취소 완료를 포함한 모든 내역은 접힌 채 시작한다", () => {
  assert.doesNotMatch(render(entries), /<details\b[^>]*\bopen=""/);
});

test("적립금이 없으면 행을 숨기고 명시된 0원과 금액은 표시한다", () => {
  for (const points of [null, 0, 1000]) {
    const html = render([{ ...cancelled, points }]);
    assert.match(html, /실 환불 금액<\/dt><dd[^>]*>199,000원<\/dd>/);
    if (points === null) {
      assert.doesNotMatch(html, /적립금 환불 금액/);
    } else {
      assert.match(
        html,
        new RegExp(`적립금 환불 금액<\/dt><dd[^>]*>${points.toLocaleString("ko-KR")}원<\/dd>`),
      );
    }
  }
});

test("교환 완료 건에는 실 환불 금액 영역이 없다", () => {
  const html = render([exchange]);
  assert.match(html, /교환 완료/);
  assert.doesNotMatch(html, /실 환불 금액/);
});

test("진행 중 배지는 주황(error), 완료·반려 배지는 회색(info) state다", () => {
  assert.match(render([delayed]), /bg-status-error text-text-error[^"]*"[^>]*>취소 진행 중</);
  assert.match(render([cancelled]), /bg-status-info text-text-info[^"]*"[^>]*>취소 완료</);
  assert.match(render([rejected]), /bg-status-info text-text-info[^"]*"[^>]*>환불 반려</);
});

test("반려 사유 행은 반려된 건에만 나온다", () => {
  assert.match(render([rejected]), /반려 사유<\/dt><dd[^>]*>제품 하자가 확인되지 않았습니다<\/dd>/);
  assert.doesNotMatch(render([cancelled]), /반려 사유/);
});

test("계약이 없어 비는 자리도 행은 그대로 남는다", () => {
  const html = render([degraded]);
  for (const label of ["접수 상품", "옵션", "판매가", "신청 수량"]) {
    assert.match(html, new RegExp(`${label}</dt><dd[^>]*>\u00a0</dd>`));
  }
});

test("총 개수는 서버가 필터를 적용한 전체 건수를 쓰고, 빈 페이지면 0개다", () => {
  assert.match(render([cancelled], { total: 42, type: "cancel" }), /총 42개/);
  assert.match(render([], { total: 42 }), /총 0개/);
});

test("유형 드롭다운과 진행 중만 보기는 받은 값을 그대로 보인다", () => {
  const html = render([delayed], { type: "cancel", inProgress: true });
  assert.match(html, /aria-label="유형 필터"[^>]*><span[^>]*>취소<\/span>/);
  assert.match(html, /<input[^>]*type="radio"[^>]*checked=""/);
});

test("반려 일자는 상세에만 두고 카드 상단 날짜는 완료된 건에만 쓴다", () => {
  const denied = render([rejected]);
  assert.match(denied, /반려 일자<\/dt><dd[^>]*>2026\.09\.06<\/dd>/);
  assert.equal(denied.split("2026.09.06").length - 1, 1);

  const done = render([cancelled]);
  assert.match(done, /<span[^>]*>2026\.09\.13<\/span>/);
  assert.doesNotMatch(done, /반려 일자/);
});
