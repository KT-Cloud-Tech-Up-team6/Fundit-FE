import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SellerProjectCard, type SellerProject } from "./seller-project-card";

const funding = {
  category: "가방",
  period: "2026.07.01 - 2026.08.12",
  participantCount: 132,
  goalAmount: 5_000_000,
} as const;

const active: SellerProject = {
  ...funding,
  status: "active",
  id: "p-1",
  title: "친환경 소재로 만든 데일리 백",
  badges: ["D-12", "목표 달성"],
  currentAmount: 6_400_000,
};

const draft: SellerProject = {
  status: "draft",
  id: "p-3",
  title: "친환경 소재로 만든 100% 오가닉! 데일리 백",
  badges: ["D-12"],
  progressLabel: "스토리 작성 중 · 60% 완료",
  openScheduledAt: "2026.09.21",
  updatedAt: "2026.08.26 12:54",
};

const closed: SellerProject = {
  ...funding,
  status: "closed",
  id: "p-c1",
  title: "친환경 소재로 만든 데일리 백",
  badges: ["배송 준비 중"],
  currentAmount: 1_600_000,
};

/* SellerProject 가 status 기준 유니온이라 Meta<typeof SellerProjectCard> 로 두면
   args 가 never 로 좁혀진다. args 타입을 직접 지정한다. */
const meta: Meta<SellerProject> = {
  title: "Entities/Project/SellerProjectCard",
  component: SellerProjectCard,
  tags: ["autodocs"],
  parameters: { layout: "centered", nextjs: { appDirectory: true } },
  decorators: [
    (Story) => (
      <div className="bg-layer-surface-default w-[588px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<SellerProject>;

/** 진행중. 모금액과 진행률 바를 노출하고 액션은 펀딩 현황으로 간다. */
export const Active: Story = { args: active };

/** 준비중. 진행률 바 대신 작성 상태와 오픈 예정일·마지막 수정일을 노출한다. */
export const Draft: Story = { args: draft };

/** 완료. 진행중과 같은 구성에 배송 상태 배지와 확인하기 버튼이 붙는다. */
export const Closed: Story = { args: closed };

/** 달성률 100% 이상이면 진행률 바가 가득 찬다. */
export const GoalReached: Story = {
  args: { ...active, badges: ["D-12", "목표 달성"], currentAmount: 6_400_000 },
};

export const Gallery: Story = {
  render: () => (
    <div className="flex flex-col">
      <SellerProjectCard {...active} />
      <SellerProjectCard {...draft} />
      <SellerProjectCard {...closed} />
    </div>
  ),
};
