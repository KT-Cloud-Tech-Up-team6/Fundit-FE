import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { refundHistory } from "../model/refunds-demo.ts";
import { BuyerRefunds } from "./buyer-refunds.tsx";

test("취소 완료 내역은 ID와 관계없이 처음 펼쳐진다", () => {
  const html = renderToStaticMarkup(
    createElement(BuyerRefunds, {
      entries: [{ ...refundHistory[1], id: "another-cancellation" }],
    }),
  );
  assert.match(html, /<details\b[^>]*\bopen=""/);
  const pending = renderToStaticMarkup(
    createElement(BuyerRefunds, {
      entries: [{ ...refundHistory[0], id: "cancel-complete" }],
    }),
  );
  assert.doesNotMatch(pending, /<details\b[^>]*\bopen=""/);
});

test("적립금이 없으면 행을 숨기고 명시된 0원과 금액은 표시한다", () => {
  for (const points of [null, 0, 1000]) {
    const html = renderToStaticMarkup(
      createElement(BuyerRefunds, { entries: [{ ...refundHistory[1], points }] }),
    );
    assert.match(html, /실 환불 금액<\/dt><dd>89,000원<\/dd>/);
    if (points === null) {
      assert.doesNotMatch(html, /적립금 환불 금액/);
    } else {
      assert.ok(html.includes(`적립금 환불 금액</dt><dd>${points.toLocaleString("ko-KR")}원</dd>`));
    }
  }
});
