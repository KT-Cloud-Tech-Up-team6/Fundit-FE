import assert from "node:assert/strict";
import test from "node:test";
import {
  categoryStage,
  categoryStatuses,
  customRangeError,
  fundingCategoryOptions,
  fundingHistoryHref,
  fundingPeriodLabel,
  fundingPeriodOptions,
  isDateKey,
  monthsBefore,
  pageByStage,
  parseFundingHistoryQuery,
  relativePeriodRange,
} from "./funding-history-filter.ts";
import { koreanDateKey } from "./funding-history.ts";

const today = "2026-09-29";

function parse(search) {
  return parseFundingHistoryQuery(new URLSearchParams(search), today);
}

test("기간 드롭다운은 FUND_2 순서의 다섯 항목이다", () => {
  assert.deepEqual(
    fundingPeriodOptions.map((option) => option.label),
    ["최근 한 달", "최근 3개월", "최근 6개월", "최근 1년", "기간 선택"],
  );
});

test("N개월 전은 같은 날이고, 그 달에 없는 날이면 말일로 당긴다", () => {
  assert.equal(monthsBefore("2026-09-29", 1), "2026-08-29");
  assert.equal(monthsBefore("2026-03-31", 1), "2026-02-28");
  assert.equal(monthsBefore("2028-03-31", 1), "2028-02-29");
  assert.equal(monthsBefore("2026-05-31", 3), "2026-02-28");
  assert.equal(monthsBefore("2026-08-31", 6), "2026-02-28");
  assert.equal(monthsBefore("2026-01-15", 1), "2025-12-15");
  assert.equal(monthsBefore("2026-02-28", 12), "2025-02-28");
  assert.equal(monthsBefore("2028-02-29", 12), "2027-02-28");
});

test("최근 N개월은 오늘까지 양 끝을 포함한 한국 날짜다", () => {
  assert.deepEqual(relativePeriodRange("1m", today), {
    period: "1m",
    from: "2026-08-29",
    to: "2026-09-29",
  });
  assert.equal(relativePeriodRange("3m", today).from, "2026-06-29");
  assert.equal(relativePeriodRange("6m", today).from, "2026-03-29");
  assert.equal(relativePeriodRange("1y", today).from, "2025-09-29");
});

test("오늘은 한국 날짜로 센다", () => {
  /* UTC 9월 28일 15:00은 한국 9월 29일 0시다. */
  assert.equal(koreanDateKey(new Date("2026-09-28T15:00:00Z")), "2026-09-29");
  assert.equal(koreanDateKey(new Date("2026-09-28T14:59:59Z")), "2026-09-28");
});

test("없는 날짜·형식은 날짜로 보지 않는다", () => {
  assert.equal(isDateKey("2026-02-28"), true);
  assert.equal(isDateKey("2026-02-30"), false);
  assert.equal(isDateKey("2026-13-01"), false);
  assert.equal(isDateKey("2026-9-1"), false);
  assert.equal(isDateKey(""), false);
});

test("직접 고른 기간은 두 날짜가 모두 있고 시작일이 늦지 않고 종료일이 오늘 뒤가 아니어야 한다", () => {
  assert.equal(customRangeError("2026-09-01", "2026-09-29", today), "");
  assert.equal(customRangeError("2026-09-29", "2026-09-29", today), "");
  assert.equal(customRangeError("", "2026-09-29", today), "시작일과 종료일을 모두 선택해 주세요.");
  assert.equal(
    customRangeError("2026-09-10", "2026-09-01", today),
    "시작일은 종료일보다 늦을 수 없습니다.",
  );
  assert.equal(
    customRangeError("2026-09-01", "2026-09-30", today),
    "종료일은 오늘 이후로 선택할 수 없습니다.",
  );
});

test("URL이 없거나 모르는 값이면 최근 한 달, 전체, 1페이지, 검색어 없음이다", () => {
  const base = {
    q: "",
    category: "all",
    page: 1,
    period: "1m",
    from: "2026-08-29",
    to: "2026-09-29",
  };
  assert.deepEqual(parse(""), base);
  assert.deepEqual(parse("period=2w&page=0"), base);
  assert.deepEqual(parse("page=abc&category=unknown"), base);
  assert.deepEqual(parse("q=%20%20&page=-1&category=toString"), base);
});

test("URL의 검색어·기간·분류·페이지를 읽는다", () => {
  assert.deepEqual(parse("q=%20%ED%81%AC%EB%A6%BC%20&period=3m&category=producing&page=2"), {
    q: "크림",
    category: "producing",
    page: 2,
    period: "3m",
    from: "2026-06-29",
    to: "2026-09-29",
  });
  assert.deepEqual(parse("period=custom&from=2026-09-01&to=2026-09-15"), {
    q: "",
    category: "all",
    page: 1,
    period: "custom",
    from: "2026-09-01",
    to: "2026-09-15",
  });
});

test("분류 드롭다운은 Figma 여섯 항목 사이에 발송 지연을 넣고 나머지 단계를 뒤에 붙인다", () => {
  assert.deepEqual(
    fundingCategoryOptions.map((option) => option.label),
    [
      "전체",
      "펀딩 진행 중",
      "펀딩 성공",
      "제작 중",
      "발송 지연",
      "배송 중",
      "배송 완료",
      "펀딩 목표 미달",
      "참여 취소",
      "결제 기한 만료",
      "환불 완료",
    ],
  );
  for (const { value } of fundingCategoryOptions) {
    assert.equal(parse(`category=${value}`).category, value);
  }
});

test("분류별 서버 status와 화면이 거를 진행 단계", () => {
  const rules = Object.fromEntries(
    fundingCategoryOptions.map(({ value }) => [
      value,
      [categoryStatuses(value).join("+"), categoryStage(value) ?? "-"],
    ]),
  );
  assert.deepEqual(rules, {
    all: ["", "-"],
    in_progress: ["PENDING+FUNDING_IN_PROGRESS", "-"],
    succeeded: ["GOAL_ACHIEVED", "-"],
    producing: ["GOAL_ACHIEVED", "FUNDING_SUCCEEDED"],
    delayed: ["GOAL_ACHIEVED", "SHIPPING_DELAYED"],
    shipping: ["GOAL_ACHIEVED", "SHIPPING"],
    delivered: ["GOAL_ACHIEVED", "DELIVERED"],
    goal_failed: ["GOAL_FAILED_REFUNDED", "-"],
    cancelled: ["CANCELLED_BY_MEMBER", "-"],
    payment_expired: ["PAYMENT_EXPIRED", "-"],
    refunded: ["REFUNDED_AFTER_SUCCESS", "-"],
  });
});

test("진행 단계 분류는 받은 목록에서 같은 단계만 남겨 20건씩 나눈다", () => {
  const stages = ["FUNDING_SUCCEEDED", "SHIPPING", "DELIVERED"];
  const orders = Array.from({ length: 130 }, (_, i) => ({ id: i, progressStage: stages[i % 3] }));
  const first = pageByStage(orders, "SHIPPING", 1, 20);
  assert.equal(first.totalElements, 43);
  assert.equal(first.hasNext, true);
  assert.deepEqual(
    first.content.slice(0, 3).map((order) => order.id),
    [1, 4, 7],
  );
  assert.ok(first.content.every((order) => order.progressStage === "SHIPPING"));
  const last = pageByStage(orders, "SHIPPING", 3, 20);
  assert.equal(last.content.length, 3);
  assert.equal(last.hasNext, false);
  const beyond = pageByStage(orders, "SHIPPING", 4, 20);
  assert.deepEqual([beyond.content.length, beyond.totalElements, beyond.hasNext], [0, 43, false]);
  assert.deepEqual(pageByStage(orders, "SHIPPING_DELAYED", 1, 20), {
    content: [],
    totalElements: 0,
    hasNext: false,
  });
});

test("잘못된 직접 기간은 최근 한 달로 돌아간다", () => {
  for (const search of [
    "period=custom",
    "period=custom&from=2026-09-10&to=2026-09-01",
    "period=custom&from=2026-09-01&to=2026-10-01",
    "period=custom&from=2026-02-30&to=2026-03-01",
  ]) {
    const query = parse(`${search}&page=3`);
    assert.equal(query.period, "1m", search);
    assert.equal(query.from, "2026-08-29", search);
    assert.equal(query.page, 3, search);
  }
});

test("URL은 기본값을 빼고 직접 기간일 때만 날짜를 남기며 읽은 값과 왕복한다", () => {
  const base = { q: "", category: "all", page: 1, ...relativePeriodRange("1m", today) };
  assert.equal(fundingHistoryHref(base), "/my/fundings");
  assert.equal(
    fundingHistoryHref({ ...base, ...relativePeriodRange("3m", today), q: "크림", page: 2 }),
    "/my/fundings?q=%ED%81%AC%EB%A6%BC&period=3m&page=2",
  );
  const custom = {
    ...base,
    period: "custom",
    from: "2026-09-01",
    to: "2026-09-15",
    category: "delivered",
  };
  const href = fundingHistoryHref(custom);
  assert.equal(href, "/my/fundings?period=custom&from=2026-09-01&to=2026-09-15&category=delivered");
  assert.deepEqual(parse(href.split("?")[1]), custom);
});

test("기간 문구는 드롭다운 항목, 직접 기간은 yyyy.mm.dd ~ yyyy.mm.dd다", () => {
  assert.equal(fundingPeriodLabel(relativePeriodRange("1m", today)), "최근 한 달");
  assert.equal(fundingPeriodLabel(relativePeriodRange("1y", today)), "최근 1년");
  assert.equal(
    fundingPeriodLabel({ period: "custom", from: "2026-09-01", to: "2026-09-15" }),
    "2026.09.01 ~ 2026.09.15",
  );
});
