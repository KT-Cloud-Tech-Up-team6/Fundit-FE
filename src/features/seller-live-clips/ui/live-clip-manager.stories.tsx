import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState, type ComponentProps } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import type { LiveSummaryResponse } from "@/entities/live/api/seller-live-api";
import {
  ProjectWorkspaceLayout,
  liveClipTab,
  projectManageTabs,
} from "@/entities/project/ui/project-sidebar";
import type { Highlight } from "@/features/live-integration/api/live-api";
import { ApiError } from "@/shared/api/api-error";
import { applySaved, splitSaveResults, toLiveClips, type LiveClip } from "../model/live-clips";
import { LiveClipIntro, LiveClipManager } from "./live-clip-manager";

const projectTitle = "[진짜싹싹] 35,000Pa 초강력 흡입, 가볍게 끝내는 무선청소기";
const thumbnail = "/images/funding-status/vacuum-cleaner.png";

function live(liveId: string, scheduledStartAt: string, thumbnailUrl: string | null) {
  return {
    liveId,
    introText: null,
    status: "ENDED",
    projectId: "demo-project",
    thumbnailUrl,
    scheduledStartAt,
    likeCount: 0,
    createdAt: scheduledStartAt,
  } satisfies LiveSummaryResponse;
}

function highlight(
  highlightId: string,
  startSec: number,
  title: string,
  overrides: Partial<Highlight> = {},
): Highlight {
  return {
    highlightId,
    sceneLabel: "PRICE_BENEFIT",
    title,
    startSec,
    endSec: startSec + 32,
    // 스토리에는 재생할 영상이 없어 LIVE 썸네일로 대신 그린다.
    clipUrl: null,
    caption: null,
    isPublic: true,
    generationStatus: "COMPLETED",
    ...overrides,
  };
}

/* LIVE 하나에 클립은 최대 3개다(BE). 최신 LIVE부터, LIVE 안에서는 시작 시각 순서다. */
const clips = toLiveClips([
  {
    live: live("live-3", "2026-09-15T01:00:00Z", thumbnail),
    clips: [
      highlight("c1", 30, "[상품명] AI가 자동생성한 제목 길이는 최대 1줄표시 넘어가면 말줄임"),
      highlight("c2", 120, "흡입력 35,000Pa를 직접 보여 드려요", { sceneLabel: "DEMO" }),
      highlight("c3", 300, "오늘만 드리는 얼리버드 혜택 정리", { isPublic: false }),
    ],
  },
  {
    live: live("live-2", "2026-09-12T01:00:00Z", thumbnail),
    clips: [
      highlight("c4", 10, "무게 1.2kg, 한 손으로 드는 무선청소기"),
      highlight("c5", 200, "먼지통 비우는 법 한 번에 보기", { sceneLabel: "SPEC" }),
      highlight("c6", 420, "배터리 사용 시간 질문에 답했어요", {
        sceneLabel: "AUDIENCE_REACTION",
        isPublic: false,
      }),
    ],
  },
  {
    // 썸네일이 없는 LIVE의 클립은 빈 면으로 그린다.
    live: live("live-1", "2026-09-05T01:00:00Z", null),
    clips: [
      highlight("c7", 60, "첫 방송 인사와 제품 소개", { sceneLabel: "INTRO" }),
      highlight("c8", 150, "경쟁 제품과 흡입력 비교", { sceneLabel: "COMPARISON" }),
      highlight("c9", 240, "마무리 인사", { sceneLabel: "CLOSING", endSec: null }),
    ],
  },
]);

const switchName = (clip: LiveClip) => `${clip.title} 상세페이지에 공개 하기`;

/* 실제 화면은 저장 뒤 목록을 다시 받는다. 스토리는 받은 값 대신 성공한 클립을 뒤집어 흉내 낸다. */
function StatefulManager(args: ComponentProps<typeof LiveClipManager>) {
  const [current, setCurrent] = useState(args.clips);
  return (
    <LiveClipManager
      {...args}
      clips={current}
      onSave={async (changes) => {
        const failed = await args.onSave(changes);
        const failedIds = new Set(failed.map(({ clip }) => clip.highlightId));
        setCurrent((value) =>
          applySaved(
            value,
            changes.filter((clip) => !failedIds.has(clip.highlightId)),
          ),
        );
        return failed;
      }}
    />
  );
}

const meta = {
  title: "Features/Seller Live Clips",
  component: LiveClipManager,
  render: (args) => <StatefulManager {...args} />,
  args: {
    projectTitle,
    clips,
    requestedPage: 1,
    buildPageHref: (page) => `/seller/projects/demo-project?tab=live&page=${page}`,
    onSave: fn(async () => []),
  },
  parameters: {
    layout: "fullscreen",
    viewport: {
      options: {
        figma390: { name: "Figma 390 × 844", styles: { width: "390px", height: "844px" } },
        desktop: { name: "Desktop 1440 × 900", styles: { width: "1440px", height: "900px" } },
      },
    },
  },
  /* Figma(2321:46422)는 1440 데스크톱만 있다. 390은 Mobile 스토리에서만 본다. */
  globals: { viewport: { value: "desktop" } },
  decorators: [
    (Story) => (
      <div className="bg-layer-surface-default min-h-screen">
        <div className="max-w-content mx-auto w-full px-5 pb-[22px] xl:px-0">
          <ProjectWorkspaceLayout
            activeTab="live"
            projectId="demo-project"
            projectName={projectTitle}
            tabs={[...projectManageTabs, liveClipTab]}
          >
            <div className="max-w-[792px] min-w-0 flex-1">
              <LiveClipIntro />
              <Story />
            </div>
          </ProjectWorkspaceLayout>
        </div>
      </div>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof LiveClipManager>;
export default meta;

type Story = StoryObj<typeof meta>;

/** Figma 첫 페이지. 공개·비공개가 섞여 있고 시연 구간 클립은 "시연 영상" 배지다. */
export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("heading", { level: 1, name: "LIVE 숏 클립 관리" }),
    ).toBeVisible();
    await expect(canvas.getByRole("link", { name: "LIVE 클립 관리" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(canvas.getByText("총 9 개")).toBeVisible();
    await expect(canvas.getAllByRole("switch")).toHaveLength(6);
    await expect(canvas.getByText("시연 영상")).toBeVisible();
    await expect(canvas.getAllByText("09.15생성")).toHaveLength(3);
    await expect(canvas.getAllByText("00:32초")).toHaveLength(6);

    const save = canvas.getByRole("button", { name: "저장" });
    const first = canvas.getByRole("switch", { name: switchName(clips[0]) });
    await expect(first).toHaveAttribute("aria-checked", "true");
    await expect(save).toBeDisabled();

    // 켰다가 되돌리면 바뀐 것이 없어 저장할 수 없다.
    await userEvent.click(first);
    await expect(first).toHaveAttribute("aria-checked", "false");
    await expect(save).toBeEnabled();
    await userEvent.click(first);
    await expect(save).toBeDisabled();

    const third = canvas.getByRole("switch", { name: switchName(clips[2]) });
    await userEvent.click(third);
    await userEvent.click(save);
    await expect(args.onSave).toHaveBeenCalledWith([clips[2]]);
    await expect(await canvas.findByRole("status")).toHaveTextContent("저장했습니다.");
    await expect(third).toHaveAttribute("aria-checked", "true");
    await expect(save).toBeDisabled();
  },
};

/** 두 번째 페이지. 나머지 3개와 길이를 모르는 클립(끝 시각 없음)이 보인다. */
export const SecondPage: Story = {
  args: { requestedPage: 2 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("switch")).toHaveLength(3);
    await expect(canvas.getByRole("link", { name: "2페이지" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(canvas.getByText("마무리 인사")).toBeVisible();
  },
};

/** 일부만 저장된 경우. 실패한 클립과 BE 이유를 알리고 그 클립만 저장 대기로 남긴다. */
export const SaveError: Story = {
  args: {
    onSave: fn(
      async (changes: LiveClip[]) =>
        splitSaveResults(
          changes,
          changes.map((clip) =>
            clip.highlightId === "c3"
              ? {
                  status: "rejected" as const,
                  reason: new ApiError({
                    code: "CONFLICT",
                    message: "생성에 실패한 항목은 공개할 수 없습니다.",
                    status: 409,
                  }),
                }
              : { status: "fulfilled" as const, value: undefined },
          ),
        ).failed,
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const failing = canvas.getByRole("switch", { name: switchName(clips[2]) });
    const passing = canvas.getByRole("switch", { name: switchName(clips[3]) });
    const save = canvas.getByRole("button", { name: "저장" });
    await userEvent.click(failing);
    await userEvent.click(passing);
    await userEvent.click(save);

    const alert = await canvas.findByRole("alert");
    await expect(alert).toHaveTextContent("숏 클립 1개의 공개 여부를 저장하지 못했습니다.");
    await expect(alert).toHaveTextContent(
      `${clips[2].title}: 생성에 실패한 항목은 공개할 수 없습니다.`,
    );
    // 실패한 클립은 바꾼 값 그대로 남아 다시 저장할 수 있고, 성공한 클립은 저장된 값이다.
    await expect(failing).toHaveAttribute("aria-checked", "true");
    await expect(passing).toHaveAttribute("aria-checked", "false");
    await expect(save).toBeEnabled();
  },
};

/** 종료된 LIVE가 없거나 생성이 끝난 클립이 없는 프로젝트. */
export const Empty: Story = {
  args: { clips: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("총 0 개")).toBeVisible();
    await expect(canvas.getByText("생성된 숏 클립이 없습니다")).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "저장" })).toBeNull();
  },
};

/** 1199px 이하는 카드를 한 줄에 하나씩 놓는다. */
export const Mobile: Story = {
  globals: { viewport: { value: "figma390" } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cards = canvas.getAllByRole("listitem").filter((item) => item.closest("ul.grid"));
    await expect(cards).toHaveLength(6);
    await expect(cards[1].getBoundingClientRect().left).toBe(cards[0].getBoundingClientRect().left);
    await expect(canvas.getByRole("button", { name: "저장" })).toBeVisible();
  },
};
