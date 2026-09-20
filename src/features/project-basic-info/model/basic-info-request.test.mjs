import assert from "node:assert/strict";
import test from "node:test";
import {
  mainCategories,
  subcategoriesByMain,
} from "../../../entities/category/model/project-categories.ts";
import { basicInfoApiError, basicInfoRequest } from "./basic-info-request.ts";

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
