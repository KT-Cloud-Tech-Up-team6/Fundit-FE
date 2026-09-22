import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { refundSummariesDemo } from "../model/refunds-demo.ts";
import { toRefundEntry } from "../model/refund-history.ts";
import { BuyerRefunds } from "./buyer-refunds.tsx";

const entries = refundSummariesDemo.map(toRefundEntry);
const [delayed, cancelled, , rejected, degraded] = entries;

const render = (list) => renderToStaticMarkup(createElement(BuyerRefunds, { entries: list }));

test("취소 완료 내역은 ID와 관계없이 처음 펼쳐진다", () => {
  assert.match(render([{ ...cancelled, id: "another-cancellation" }]), /<details\b[^>]*\bopen=""/);
  assert.doesNotMatch(render([{ ...delayed, id: cancelled.id }]), /<details\b[^>]*\bopen=""/);
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

test("총 개수는 필터를 걸지 않은 동안 서버 전체 건수를 쓴다", () => {
  const withTotal = renderToStaticMarkup(
    createElement(BuyerRefunds, { entries: [cancelled], total: 42 }),
  );
  assert.match(withTotal, /총 42개/);
  assert.match(render([cancelled]), /총 1개/);
});
