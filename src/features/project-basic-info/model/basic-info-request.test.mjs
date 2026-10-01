import assert from "node:assert/strict";
import test from "node:test";
import {
  mainCategories,
  subcategoriesByMain,
} from "../../../entities/category/model/project-categories.ts";
import { basicInfoFieldErrors, basicInfoRequest } from "./basic-info-request.ts";

// 임시저장(draft)·저장(edit) 검증의 첫 오류 문구. 비어 있으면 저장해도 된다.
const basicInfoApiError = (values, partial) =>
  Object.values(basicInfoFieldErrors(values, partial ? "draft" : "edit"))[0] ?? "";

// PRD 4.2.4와 BE V14 확정 계약. 구매자 목업이나 실제 옵션에서 기대값을 만들지 않는다.
const confirmed = [
  ["테크·가전", "생활가전,로봇,엔터테인먼트가전"],
  ["홈·리빙", "침실,욕실,주방,청소,인테리어,방향제"],
  ["뷰티", "스킨케어,메이크업,헤어케어,네일,향수"],
  ["패션", "의류,패션소품,가방,신발,키즈"],
  ["푸드", "산지직송,로컬맛집,헬스,소스,디저트,음료,주류"],
  ["스포츠", "캠핑,골프,러닝,자전거,테니스,헬스,등산,기타"],
  ["캐릭터·굿즈", "애니메이션,게임,케이팝,크리에이터"],
];
const values = {
  business: "일반 사업자",
  title: "프로젝트",
  amount: "500000",
  category: "",
  subcategory: "",
};

test("판매자 옵션 7개 대분류·38개 조합은 확정 계약과 같고 한글명으로 전송된다", () => {
  assert.deepEqual(
    mainCategories,
    confirmed.map(([major]) => major),
  );
  let count = 0;
  for (const [category, minors] of confirmed) {
    assert.deepEqual(
      subcategoriesByMain[category],
      minors.split(",").map((name) => ({ value: name, label: name })),
    );
    for (const subcategory of minors.split(",")) {
      const input = { ...values, category, subcategory };
      assert.equal(basicInfoApiError(input, false), "");
      assert.equal(basicInfoApiError(input, true), "");
      assert.deepEqual(basicInfoRequest(input), {
        businessType: "GENERAL",
        title: "프로젝트",
        goalAmount: 500000,
        categoryMajor: category,
        categoryMinor: subcategory,
      });
      count++;
    }
  }
  assert.equal(count, 38);
});

test("slug·자리표시자·다른 대분류의 소분류와 불완전한 조합은 저장 전에 차단한다", () => {
  for (const [category, subcategory] of [
    ["테크·가전", "computers"],
    ["뷰티", "sub-1"],
    ["뷰티", "소분류 명"],
    ["여행", "여행"],
    ["홈·리빙", "로봇"],
    ["뷰티", ""],
    ["", "스킨케어"],
  ]) {
    for (const partial of [false, true]) {
      assert.notEqual(basicInfoApiError({ ...values, category, subcategory }, partial), "");
    }
  }
  assert.equal(basicInfoApiError(values, true), "");
  assert.equal("categoryMajor" in basicInfoRequest(values), false);
  assert.equal("categoryMinor" in basicInfoRequest(values), false);
});

const complete = {
  business: "일반 사업자",
  title: "프로젝트",
  category: "뷰티",
  subcategory: "스킨케어",
  amount: "500000",
};

test("신규 생성 저장은 사업자 유형·제목·카테고리·목표 금액·리워드가 모두 있어야 한다", () => {
  assert.deepEqual(basicInfoFieldErrors(complete, "create", 1), {});
  const missing = [
    ["business", { business: "" }, 1],
    ["title", { title: "  " }, 1],
    ["category", { category: "", subcategory: "" }, 1],
    ["subcategory", { subcategory: "" }, 1],
    ["amount", { amount: "" }, 1],
    ["rewards", {}, 0],
  ];
  for (const [field, patch, rewardCount] of missing) {
    const errors = basicInfoFieldErrors({ ...complete, ...patch }, "create", rewardCount);
    // 빠진 칸만 오류로 알린다. 다른 칸은 입력이 있으니 그대로 둔다.
    assert.deepEqual(Object.keys(errors), [field]);
    assert.notEqual(errors[field], "");
  }
  assert.deepEqual(
    Object.keys(basicInfoFieldErrors({ ...complete, business: "", amount: "" }, "create", 0)),
    ["business", "amount", "rewards"],
  );
});

test("신규 생성 저장은 상세만 있거나 목록에 없는 카테고리 조합을 다시 고르게 한다", () => {
  for (const patch of [
    { category: "", subcategory: "스킨케어" },
    { category: "뷰티", subcategory: "의류" },
    { category: "여행", subcategory: "여행" },
  ]) {
    const errors = basicInfoFieldErrors({ ...complete, ...patch }, "create", 1);
    assert.deepEqual(Object.keys(errors), ["category"]);
  }
});

test("임시저장은 필수값 없이 형식만 검사하고, 기존 프로젝트 저장은 제목·목표 금액만 요구한다", () => {
  const empty = { business: "", title: "", category: "", subcategory: "", amount: "" };
  assert.deepEqual(basicInfoFieldErrors(empty, "draft"), {});
  assert.deepEqual(Object.keys(basicInfoFieldErrors(empty, "edit")), ["title", "amount"]);
  assert.deepEqual(
    basicInfoFieldErrors({ ...complete, amount: "1000" }, "draft").amount?.length > 0,
    true,
  );
  assert.equal(
    basicInfoFieldErrors({ ...complete, title: "가".repeat(41) }, "draft").title?.length > 0,
    true,
  );
});
