import assert from "node:assert/strict";
import test from "node:test";
import { toFundingMeta, toSellerProject } from "./seller-project-response.ts";
import { authTokenStore } from "../../../shared/api/auth-token-store.ts";
import { getSellerProjects, saveProjectBasicInfo } from "../api/seller-project-api.ts";
import {
  basicInfoRequest,
  basicInfoFieldErrors,
} from "../../../features/project-basic-info/model/basic-info-request.ts";

// 임시저장(draft)·저장(full) 검증의 첫 오류 문구. 비어 있으면 저장해도 된다.
const basicInfoApiError = (values, partial) =>
  Object.values(basicInfoFieldErrors(values, partial ? "draft" : "full", 1))[0] ?? "";

const item = {
  projectId: "01990000-0000-7000-8000-000000000001",
  title: null,
  thumbnailUrl: null,
  status: "DRAFT",
  createdAt: "2026-09-01T00:00:00Z",
  fundingStartAt: null,
  fundingDeadline: null,
  goalAmount: null,
  categoryMajor: null,
  categoryMinor: null,
  currentAmount: 0,
  participantCount: 0,
  achievementRate: 0,
};

test("준비중 응답의 누락된 이미지를 목업으로 대체하지 않고 날짜·D-day를 두지 않는다", () => {
  const project = toSellerProject(item);
  assert.equal(project.id, item.projectId);
  assert.equal(project.thumbnail, "");
  assert.equal(project.status, "draft");
  assert.deepEqual(project.badges, []);
  assert.equal("openScheduledAt" in project || "updatedAt" in project, false);
});

test("진행중은 BE와 같은 공식으로 마감까지 남은 D-day를 표시한다", () => {
  const now = Date.parse("2026-09-23T03:00:00Z");
  const ongoing = (deadline) =>
    toSellerProject({ ...item, status: "ONGOING", fundingDeadline: deadline }, now).badges;
  assert.deepEqual(ongoing("2026-10-23T03:00:00Z"), [{ label: "D-31", variant: "neutral" }]);
  assert.equal(ongoing("2026-09-23T04:00:00Z")[0].label, "D-1");
  assert.equal(ongoing("2026-09-23T02:59:59Z")[0].label, "종료");
  assert.deepEqual(ongoing(null), []);
});

test("펀딩 관리 헤더는 목록 카드와 같은 대분류·펀딩 기간(한국 날짜)을 쓴다", () => {
  const ongoing = {
    ...item,
    status: "ONGOING",
    categoryMajor: "테크·가전",
    // 한국 시간으로 10월 2일·11월 1일이다(UTC 날짜와 다르다).
    fundingStartAt: "2026-10-01T15:30:00Z",
    fundingDeadline: "2026-10-31T16:00:00Z",
  };
  const meta = toFundingMeta(ongoing);
  assert.deepEqual(meta, {
    category: "테크·가전",
    period: { start: "2026. 10. 02.", end: "2026. 11. 01." },
  });
  assert.equal(toSellerProject(ongoing).period, `${meta.period.start} - ${meta.period.end}`);
  assert.equal(toSellerProject(ongoing).category, meta.category);
  // 값이 없으면 목록 카드와 같이 "미분류"·"미정"이다.
  assert.deepEqual(toFundingMeta({ ...ongoing, categoryMajor: null, fundingStartAt: null }), {
    category: "미분류",
    period: { start: "미정", end: "2026. 11. 01." },
  });
});

test("서버 완료 상태를 성공과 실패로 구분하고 금액을 유지한다", () => {
  for (const status of ["SUCCEEDED", "FAILED"]) {
    const project = toSellerProject({ ...item, status, currentAmount: 300, goalAmount: 500 });
    assert.equal(project.status, "closed");
    assert.equal(project.currentAmount, 300);
    assert.equal(project.badges[0].label, status === "SUCCEEDED" ? "펀딩 성공" : "펀딩 실패");
  }
});

test("조회하지 못한 필드는 PATCH에서 제외한다", () => {
  assert.deepEqual(
    basicInfoRequest({
      business: "",
      category: "",
      subcategory: "",
      title: " 제목 ",
      amount: "500000",
    }),
    { title: "제목", goalAmount: 500000 },
  );
});

test("사업자 코드 변환과 기본정보 입력 제약을 검증한다", () => {
  const values = {
    business: "법인 사업자",
    category: "테크·가전",
    subcategory: "생활가전",
    title: "제목",
    amount: "500000",
  };
  assert.equal(basicInfoRequest(values).businessType, "CORP");
  assert.equal(basicInfoApiError(values, false), "");
  assert.notEqual(basicInfoApiError({ ...values, title: "가".repeat(41) }, false), "");
  assert.notEqual(basicInfoApiError({ ...values, amount: "9007199254740992" }, true), "");
  assert.notEqual(basicInfoApiError({ ...values, subcategory: "" }, true), "");
});

test("목록은 완료 다중 상태와 검색어, 0 기반 페이지를 Bearer 인증으로 전달한다", async (t) => {
  authTokenStore.set("test-token");
  t.mock.method(globalThis, "fetch", async (url, options) => {
    const query = new URL(url, "https://test.invalid").searchParams;
    assert.equal(query.get("status"), "SUCCEEDED,FAILED");
    assert.equal(query.get("q"), "한글 & 검색");
    assert.equal(query.get("page"), "1");
    assert.equal(query.get("size"), "8");
    assert.equal(options.headers.get("Authorization"), "Bearer test-token");
    return new Response(JSON.stringify({ content: [], totalPages: 0 }));
  });
  await getSellerProjects("closed", " 한글 & 검색 ", 2);
});

test("저장 실패를 성공 결과로 대체하지 않는다", async (t) => {
  t.mock.method(
    globalThis,
    "fetch",
    async () => new Response('{"code":"FORBIDDEN"}', { status: 403 }),
  );
  await assert.rejects(saveProjectBasicInfo(item.projectId, { title: "수정" }), { status: 403 });
});
