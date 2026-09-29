import { http, HttpResponse } from "msw";

import type { RewardRequest, RewardResponse } from "@/entities/project/api/reward-api";
import type { BasicInfoRequest, ProjectListItem } from "@/entities/project/api/seller-project-api";
import type { PublicProject, PublicReward } from "@/entities/project/api/buyer-project-api";

import {
  FIXTURE_LIMITED_REWARD_ID,
  FIXTURE_PROJECT_ID,
  FIXTURE_REWARD_ID,
  FIXTURE_SELLER_PROJECT_ID,
  FIXTURE_SOLD_OUT_REWARD_ID,
} from "./fixtures";

const fixtureProject: PublicProject = {
  projectId: FIXTURE_PROJECT_ID,
  title: "감성 캠핑 무드등 세트",
  status: "ONGOING",
  goalAmount: 5_000_000,
  coverImageUrl: null,
  introContent: [],
  fundingStatus: {
    currentAmount: 1_200_000,
    achievementRate: 24,
    participantCount: 12,
    remainingDays: 10,
  },
  hasLiveVerification: false,
  seller: { sellerId: "seller-demo", displayName: "무드등 공방" },
};

const fixtureReward: PublicReward = {
  rewardId: FIXTURE_REWARD_ID,
  rewardDisplayCode: "RW-001",
  name: "기본 무드등 1개",
  description: "기본 구성 리워드입니다.",
  price: 39_000,
  isEarlyBird: false,
  isLimited: false,
  options: [],
  soldOut: false,
};

const fixtureLimitedReward: PublicReward = {
  ...fixtureReward,
  rewardId: FIXTURE_LIMITED_REWARD_ID,
  rewardDisplayCode: "RW-002",
  name: "한정 무드등 1개",
  isLimited: true,
};

const fixtureSoldOutReward: PublicReward = {
  ...fixtureReward,
  rewardId: FIXTURE_SOLD_OUT_REWARD_ID,
  rewardDisplayCode: "RW-003",
  name: "품절 무드등 1개",
  isLimited: true,
  soldOut: true,
};

/* 판매자가 새로 만드는 프로젝트/리워드만 담는 인메모리 스토어. dev 서버 프로세스 생명주기 동안만
   유지되고 테스트 사이에 리셋하지 않는다 — 플로우3 시나리오 하나만 이 값을 쓴다. */
type SellerProjectRecord = { basicInfo: BasicInfoRequest; rewards: RewardResponse[] };
const sellerProjects = new Map<string, SellerProjectRecord>();
let nextRewardId = 10_001;

export const projectHandlers = [
  /* ProjectBasicInfoApi가 edit 모드 진입 때(저장 완료 모달의 "다음에" 이후) 여는 화면이 읽는다. */
  http.get("*/api/v1/projects/:id/preview", ({ params }) => {
    const projectId = String(params.id);
    const record = sellerProjects.get(projectId);
    if (!record)
      return HttpResponse.json({ code: "NOT_FOUND", message: "프로젝트 없음" }, { status: 404 });
    return HttpResponse.json({
      projectId,
      categoryMajor: record.basicInfo.categoryMajor ?? null,
      categoryMinor: record.basicInfo.categoryMinor ?? null,
      title: record.basicInfo.title ?? null,
      status: "DRAFT",
      goalAmount: record.basicInfo.goalAmount ?? null,
      coverImageUrl: null,
      businessType: record.basicInfo.businessType ?? null,
    });
  }),

  http.get("*/api/v1/projects/:id/rewards/mine", ({ params }) => {
    const record = sellerProjects.get(String(params.id));
    if (!record)
      return HttpResponse.json({ code: "NOT_FOUND", message: "프로젝트 없음" }, { status: 404 });
    return HttpResponse.json(record.rewards);
  }),

  /* 판매자 프로젝트 목록. 진행 중 1건은 제작·배송 스펙과 같은 고정 프로젝트이고, 준비중은 이 탭에서
     새로 만든 프로젝트다. `status-counts`는 `:id` 핸들러보다 먼저 와야 한다. */
  http.get("*/api/v1/projects/status-counts", () =>
    HttpResponse.json({ ongoing: 1, draft: sellerProjects.size, completed: 0 }),
  ),

  http.get("*/api/v1/projects", ({ request }) => {
    const query = new URL(request.url).searchParams;
    const statuses = (query.get("status") ?? "").split(",");
    const q = query.get("q") ?? "";
    const now = new Date();
    const created = [...sellerProjects].map(([projectId, record]): ProjectListItem => ({
      projectId,
      title: record.basicInfo.title ?? null,
      thumbnailUrl: null,
      status: "DRAFT",
      createdAt: now.toISOString(),
      fundingStartAt: null,
      fundingDeadline: null,
      goalAmount: record.basicInfo.goalAmount ?? null,
      categoryMajor: record.basicInfo.categoryMajor ?? null,
      categoryMinor: record.basicInfo.categoryMinor ?? null,
      currentAmount: 0,
      participantCount: 0,
      achievementRate: 0,
    }));
    const ongoing: ProjectListItem = {
      projectId: FIXTURE_SELLER_PROJECT_ID,
      title: "E2E 제작·배송 프로젝트",
      thumbnailUrl: null,
      status: "ONGOING",
      createdAt: now.toISOString(),
      fundingStartAt: now.toISOString(),
      fundingDeadline: new Date(now.getTime() + 10 * 86_400_000).toISOString(),
      goalAmount: 5_000_000,
      categoryMajor: "테크·가전",
      categoryMinor: null,
      currentAmount: 1_200_000,
      participantCount: 12,
      achievementRate: 24,
    };
    const content = [ongoing, ...created].filter(
      (item) => statuses.includes(item.status) && (!q || item.title?.includes(q)),
    );
    return HttpResponse.json({
      content,
      page: 0,
      size: 8,
      totalElements: content.length,
      totalPages: content.length ? 1 : 0,
      hasNext: false,
    });
  }),

  /* LIVE 체크 탭. 둘째 항목은 방송 종료 뒤 질문 요약을 받기 전에 등록된 답변(질문 문구·건수 없음)이다. */
  http.get("*/api/v1/projects/:id/live-verifications", ({ params }) =>
    HttpResponse.json({
      content:
        String(params.id) === FIXTURE_PROJECT_ID
          ? [
              {
                liveVerificationId: 1,
                questionSummaryId: "summary-1",
                questionText: "배터리는 얼마나 오래 가나요?",
                questionCount: 12,
                answer: "완충하면 최대 8시간 사용할 수 있어요.",
              },
              {
                liveVerificationId: 2,
                questionSummaryId: "summary-2",
                questionText: null,
                questionCount: 0,
                answer: "생활 방수(IPX4) 등급입니다.",
              },
            ]
          : [],
    }),
  ),

  http.get("*/api/v1/projects/:id/rewards", ({ params }) => {
    if (String(params.id) !== FIXTURE_PROJECT_ID) return HttpResponse.json([]);
    return HttpResponse.json([fixtureReward, fixtureLimitedReward, fixtureSoldOutReward]);
  }),

  http.get("*/api/v1/projects/:id", ({ params }) => {
    if (String(params.id) !== FIXTURE_PROJECT_ID)
      return HttpResponse.json({ code: "NOT_FOUND", message: "프로젝트 없음" }, { status: 404 });
    return HttpResponse.json(fixtureProject);
  }),

  http.post("*/api/v1/projects", () => {
    const projectId = crypto.randomUUID();
    sellerProjects.set(projectId, { basicInfo: {}, rewards: [] });
    return HttpResponse.json({ projectId, status: "DRAFT" });
  }),

  http.post("*/api/v1/projects/:id/privacy-consent", ({ params }) =>
    HttpResponse.json({ projectId: String(params.id), consentedAt: new Date().toISOString() }),
  ),

  http.patch("*/api/v1/projects/:id/basic-info", async ({ params, request }) => {
    const projectId = String(params.id);
    const record = sellerProjects.get(projectId) ?? { basicInfo: {}, rewards: [] };
    record.basicInfo = { ...record.basicInfo, ...((await request.json()) as BasicInfoRequest) };
    sellerProjects.set(projectId, record);
    return HttpResponse.json({
      ...record.basicInfo,
      projectId,
      updatedAt: new Date().toISOString(),
    });
  }),

  http.post("*/api/v1/projects/:id/rewards", async ({ params, request }) => {
    const projectId = String(params.id);
    const record = sellerProjects.get(projectId) ?? { basicInfo: {}, rewards: [] };
    const body = (await request.json()) as RewardRequest;
    const created: RewardResponse = {
      rewardId: nextRewardId++,
      rewardDisplayCode: `RW-${String(nextRewardId).padStart(3, "0")}`,
      name: body.name,
      description: body.description,
      imageUrl: body.imageUrl,
      price: body.price,
      isLimited: body.isLimited,
      quantity: body.quantity,
      hasOption: Boolean(body.options?.length),
      sortOrder: record.rewards.length,
      isEarlyBird: body.isEarlyBird,
      earlyBirdDiscountType: body.earlyBirdDiscountType,
      earlyBirdDiscountValue: body.earlyBirdDiscountValue,
      simpleRefundDisabled: false,
      options:
        body.options?.map((group, index) => ({
          groupId: group.optionGroupId ?? index + 1,
          groupName: group.groupName,
          values: group.values.map((value) => ({ valueId: null, value })),
        })) ?? [],
    };
    record.rewards.push(created);
    sellerProjects.set(projectId, record);
    return HttpResponse.json(created);
  }),
];
