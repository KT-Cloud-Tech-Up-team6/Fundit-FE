import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { BuyerLiveReplay } from "./buyer-live-replay";

const meta = {
  title: "Features/BuyerLive/Replay",
  component: BuyerLiveReplay,
  parameters: { layout: "fullscreen", nextjs: { appDirectory: true } },
  args: { liveId: "demo-live" },
} satisfies Meta<typeof BuyerLiveReplay>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByRole("button", { name: "채팅" })).toHaveAttribute("aria-pressed", "true");
    expect(canvas.getByRole("region", { name: "다시보기 채팅 기록" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "팔로우" }));
    expect(canvas.getByRole("button", { name: "팔로잉" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(canvas.getByRole("button", { name: "리워드 5개 이상 더보기" }));
    expect(canvas.getByRole("status")).toHaveTextContent("연결된 프로젝트 정보가 없는 목업");
  },
};
export const Chapters: Story = {
  args: { initialPanel: "chapters" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getAllByRole("button", { name: /구간 \d 재생/ })).toHaveLength(4);
    expect(canvas.getByRole("button", { name: "구간 1 재생" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await userEvent.click(canvas.getByRole("button", { name: "일시정지" }));
    await userEvent.click(canvas.getByRole("button", { name: "구간 2 재생" }));
    expect(canvas.getByRole("button", { name: "구간 2 재생" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(canvas.getByRole("slider")).toHaveValue("50");
    expect(canvas.getByRole("button", { name: "일시정지" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "다음 구간" }));
    expect(canvas.getByRole("slider")).toHaveValue("75");
    await userEvent.click(canvas.getByRole("button", { name: "채팅" }));
    expect(canvas.queryByRole("region", { name: "영상 구간 목록" })).not.toBeInTheDocument();
  },
};
export const InitialNextChapter: Story = {
  args: { initialPanel: "chapters" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByRole("button", { name: "구간 1 재생" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    const initialProgress = Number((canvas.getByRole("slider") as HTMLInputElement).value);
    await userEvent.click(canvas.getByRole("button", { name: "다음 구간" }));
    expect(Number((canvas.getByRole("slider") as HTMLInputElement).value)).toBeGreaterThan(
      initialProgress,
    );
    expect(canvas.getByRole("button", { name: "구간 2 재생" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await userEvent.click(canvas.getByRole("button", { name: "이전 구간" }));
    expect(canvas.getByRole("slider")).toHaveValue("0");
    expect(canvas.getByRole("button", { name: "이전 구간" })).toBeDisabled();
    expect(canvas.getByRole("button", { name: "일시정지" })).toHaveFocus();
    await userEvent.click(canvas.getByRole("button", { name: "구간 4 재생" }));
    expect(canvas.getByRole("slider")).toHaveValue("90");
    expect(canvas.getByRole("button", { name: "다음 구간" })).toBeDisabled();
  },
};

export const BoundaryKeyboardFocus: Story = {
  args: { initialPanel: "chapters" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "구간 3 재생" }));
    canvas.getByRole("button", { name: "다음 구간" }).focus();
    await userEvent.keyboard("{Enter}");
    expect(canvas.getByRole("button", { name: "다음 구간" })).toBeDisabled();
    expect(canvas.getByRole("button", { name: "일시정지" })).toHaveFocus();
    await userEvent.click(canvas.getByRole("button", { name: "구간 2 재생" }));
    canvas.getByRole("button", { name: "이전 구간" }).focus();
    await userEvent.keyboard("{Enter}");
    expect(canvas.getByRole("button", { name: "이전 구간" })).toBeDisabled();
    expect(canvas.getByRole("button", { name: "일시정지" })).toHaveFocus();
  },
};

export const Clip: Story = {
  args: { clip: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText("시연 영상")).toBeVisible();
    expect(canvas.queryByRole("slider")).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "좋아요" }));
    expect(canvas.getByRole("button", { name: "좋아요" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(canvas.getByRole("button", { name: "채팅" }));
    expect(canvas.getByRole("status")).toHaveTextContent("숏 클립 채팅은 아직 연결되지 않은 목업");
  },
};

/* 아래는 실제 경로(RealBuyerLive)가 쓰는 연결 상태다. 구간·채팅·재생 위치를 바깥이 소유한다. */
const connectedChapters = [
  { time: "00:00", title: "방송 시작", label: "도입", progress: 0 },
  { time: "01:00", title: "제품 소개", label: "스펙·기능", progress: 50 },
];
const connectedArgs = {
  demoMode: false,
  chapters: connectedChapters,
  progress: 0,
  video: <div data-testid="player">영상 자리</div>,
  replayMessages: [
    { id: "0:0", author: "시청자", text: "구간 채팅입니다" },
    { id: "10:1", author: "시청자", text: "두 번째 메시지" },
  ],
};

export const Connected: Story = {
  args: { ...connectedArgs, onSeek: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByTestId("player")).toBeVisible();
    // 실제 경로도 Figma 재생바를 그리되 목업 문구(목업 재생 위치)는 쓰지 않는다.
    expect(canvas.getByRole("slider", { name: "재생 위치" })).toBeInTheDocument();
    expect(canvas.queryByRole("slider", { name: "목업 재생 위치" })).not.toBeInTheDocument();
    expect(canvas.queryByRole("button", { name: "팔로우" })).not.toBeInTheDocument();
    expect(canvas.queryByLabelText("연결된 프로젝트 목업")).not.toBeInTheDocument();
    expect(canvas.getByText("구간 채팅입니다")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "타임라인" }));
    await userEvent.click(canvas.getByRole("button", { name: "구간 2 재생" }));
    expect(args.onSeek).toHaveBeenCalledWith(50);
    // 위치는 바깥이 소유하므로 progress가 그대로면 선택 구간도 그대로다.
    expect(canvas.getByRole("button", { name: "구간 1 재생" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  },
};

export const ConnectedWithoutChapters: Story = {
  args: { ...connectedArgs, chapters: [], onSeek: fn() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.queryByRole("button", { name: "타임라인" })).not.toBeInTheDocument();
    expect(canvas.queryByRole("region", { name: "영상 구간 목록" })).not.toBeInTheDocument();
    expect(canvas.getByRole("region", { name: "다시보기 채팅 기록" })).toBeVisible();
  },
};

export const ConnectedClip: Story = {
  args: {
    ...connectedArgs,
    clip: true,
    clipId: "clip-2",
    clipTitle: "[로보락 F25] 고추기름도 한 번에",
    clipBadge: "하이라이트",
    liked: false,
    onToggleLike: fn(),
    /* 클립에는 Q&A 버튼이 없다. 데이터를 줘도 열 수 없는 시트를 그리지 않는다. */
    questionsData: [
      { id: "q1", title: "질문", count: 1, answer: "답변", answeredBy: "판매자 답변" },
    ],
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    // 제목·배지는 쇼츠 응답 값을 쓰고, 영상에 번인된 자막을 화면 자막으로 겹쳐 그리지 않는다.
    expect(canvas.getByRole("heading", { name: "[로보락 F25] 고추기름도 한 번에" })).toBeVisible();
    expect(canvas.getByText("하이라이트")).toBeVisible();
    expect(canvas.queryByText(/물걸레\+진공/)).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "좋아요" }));
    expect(args.onToggleLike).toHaveBeenCalled();
    // 좋아요 상태는 바깥(방송 좋아요 API)이 소유해 로컬로 켜지지 않는다.
    expect(canvas.getByRole("button", { name: "좋아요" })).toHaveAttribute("aria-pressed", "false");
    expect(canvas.queryByRole("dialog")).not.toBeInTheDocument();
    // 실제 경로에서는 내부 용어("목업")를 쓰지 않는다.
    await userEvent.click(canvas.getByRole("button", { name: "채팅" }));
    expect(await canvas.findByText("숏 클립 채팅은 아직 제공되지 않습니다.")).toBeVisible();
  },
};

export const ConnectedQuestions: Story = {
  args: {
    ...connectedArgs,
    questionsData: [
      {
        id: "q1",
        title: "카펫에도 쓸 수 있나요?",
        count: 7,
        answer: "하드 플로어 전용입니다.",
        answeredBy: "판매자 답변",
      },
    ],
    onRefreshQuestions: fn(),
    onSeek: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Q&A" }));
    const dialog = await canvas.findByRole("dialog");
    expect(dialog).toHaveAccessibleName("Q&A");
    expect(within(dialog).getByText("카펫에도 쓸 수 있나요?")).toBeVisible();
    expect(within(dialog).getByText("하드 플로어 전용입니다.")).toBeVisible();
    // demoMode=false라 "판매자 · 1분 전" 목업 서명 대신 실제 답변자를 쓴다.
    expect(within(dialog).getByText("판매자 답변")).toBeVisible();
    await userEvent.click(within(dialog).getByRole("button", { name: "새로고침" }));
    expect(args.onRefreshQuestions).toHaveBeenCalled();
    await userEvent.click(within(dialog).getByRole("button", { name: "Q&A 닫기" }));
    expect(dialog).not.toBeVisible();
  },
};

export const DemoQuestionsNotice: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Q&A" }));
    // 데모 경로는 #156에서 정한 안내 동작을 그대로 유지한다.
    expect(canvas.getByRole("status")).toHaveTextContent("다시보기 Q&A는 아직 연결되지 않은 목업");
    expect(canvas.queryByRole("dialog")).not.toBeInTheDocument();
  },
};
