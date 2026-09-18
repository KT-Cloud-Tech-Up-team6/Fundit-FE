import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { RewardSummaryList } from "@/features/reward-selection/ui/reward-summary-list";
import { RewardSheet } from "@/features/reward-selection/ui/reward-sheet";
import { FundingCta } from "@/features/reward-selection/ui/funding-cta";
import { BuyerProjectDetail } from "./buyer-project-detail";
import styles from "./buyer-project-detail.module.css";

const meta = {
  title: "Features/BuyerProject/Detail",
  component: BuyerProjectDetail,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen", nextjs: { appDirectory: true } },
  args: {
    rewardSummary: <RewardSummaryList />,
    projectId: "demo-project",
    activeTab: "story",
    fundingAction: <FundingCta projectId="demo-project" className={styles.funding} />,
  },
} satisfies Meta<typeof BuyerProjectDetail>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByRole("link", { name: "리워드 정보" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(canvas.getByRole("link", { name: /LIVE 체크/ })).toHaveAttribute(
      "href",
      "/projects/demo-project?tab=live-proof",
    );
    expect(canvas.getByRole("img", { name: /CleanForge/ })).toBeInTheDocument();
    const like = canvas.getByRole("button", { name: "프로젝트 찜" });
    await userEvent.click(like);
    expect(like).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(like);
    expect(like).toHaveAttribute("aria-pressed", "false");
  },
};

export const LiveCheck: Story = {
  args: { activeTab: "live-proof" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByRole("link", { name: /LIVE 체크/ })).toHaveAttribute("aria-current", "page");
    expect(
      within(canvas.getByRole("region", { name: "종료된 라이브 목록" })).getAllByRole("article"),
    ).toHaveLength(2);
    expect(
      within(canvas.getByRole("region", { name: "숏 클립 목록" })).getAllByRole("article"),
    ).toHaveLength(5);
    expect(
      within(canvas.getByRole("region", { name: "LIVE Q&A" })).getAllByRole("article"),
    ).toHaveLength(5);
    expect(canvas.getByRole("link", { name: /^종료된 라이브 1/ })).toHaveAttribute(
      "href",
      "/live/demo-live?mode=replay",
    );
    expect(canvas.getByRole("link", { name: /^숏 클립 1/ })).toHaveAttribute(
      "href",
      "/live/demo-live?mode=replay&view=clip",
    );
  },
};

export const InformationTip: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "AI 프로젝트 요약 안내" });
    await userEvent.click(button);
    expect(canvas.getByRole("tooltip")).toHaveTextContent("판매자의 검토 및 수정");
    expect(canvas.getByRole("tooltip")).toHaveTextContent("판매자의 검토 및 수정");
    const tooltip = canvas.getByRole("tooltip");
    const body = within(tooltip)
      .getByText(
        "본 상품 정보는 AI를 활용하여 작성된 후 판매자의 검토 및 수정을 거쳐 게시되었습니다.",
      )
      .closest("div")!;
    expect(getComputedStyle(body).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(getComputedStyle(body).fontSize).toBe("11px");
    expect(getComputedStyle(body).fontWeight).toBe("500");
    expect(tooltip.getBoundingClientRect().width).toBeGreaterThan(100);
    expect(tooltip.getBoundingClientRect().height).toBeLessThan(200);
    await userEvent.keyboard("{Escape}");
    expect(canvas.queryByRole("tooltip")).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  },
};

export const LiveInformationTip: Story = {
  ...InformationTip,
  args: { activeTab: "live-proof" },
  play: async (context) => {
    await InformationTip.play?.(context);
    const canvas = within(context.canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "LIVE Q&A 안내" }));
    expect(canvas.getByRole("tooltip")).toHaveTextContent("판매자의 검토 및 수정");
    expect(canvas.getByRole("button", { name: "프로젝트 찜" })).toHaveTextContent("9999+");
    await userEvent.keyboard("{Escape}");
    expect(canvas.queryByRole("tooltip")).not.toBeInTheDocument();
  },
};

export const FundingSelection: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "펀딩하기" });
    await userEvent.click(trigger);
    const dialog = await canvas.findByRole("dialog");
    expect(dialog).toBeVisible();
    await userEvent.click(within(dialog).getByRole("button", { name: "리워드 선택 닫기" }));
    await waitFor(() => expect(dialog).not.toBeVisible());
    expect(trigger).toHaveFocus();
  },
};

export const DesktopRewards: Story = {
  args: {
    rewardSelection: <RewardSheet projectId="demo-project" inlineFormId="desktop-rewards" />,
    fundingAction: (
      <FundingCta
        projectId="demo-project"
        desktopFormId="desktop-rewards"
        className={styles.funding}
      />
    ),
  },
  play: async ({ canvasElement }) => {
    if (!window.matchMedia("(min-width: 1200px)").matches) return;
    const canvas = within(canvasElement);
    const form = within(canvas.getByRole("form", { name: "웹 리워드 선택" }));
    await userEvent.click(canvas.getByRole("button", { name: "펀딩하기" }));
    expect(canvas.queryByRole("dialog")).not.toBeInTheDocument();
    await userEvent.click(form.getByRole("button", { name: /가장 먼저 만나는 스타터 세트/ }));
    await userEvent.click(
      form.getByRole("button", { name: "가장 먼저 만나는 스타터 세트 수량 늘리기" }),
    );
    expect(form.getByRole("status", { name: "리워드 총 금액" })).toHaveTextContent("398,000원");
    await userEvent.click(form.getByRole("button", { name: "리워드" }));
    await userEvent.click(
      within(form.getByRole("group", { name: "리워드 목록" })).getByRole("button", {
        name: /스탠다드 세트/,
      }),
    );
    expect(form.getByRole("status", { name: "리워드 총 금액" })).toHaveTextContent("617,000원");
    expect(
      within(form.getByRole("group", { name: "선택한 리워드" })).getAllByRole("heading")[0],
    ).toHaveTextContent("스탠다드 세트");
    await userEvent.click(form.getByRole("button", { name: "스탠다드 세트 삭제" }));
    expect(form.getByRole("status", { name: "리워드 총 금액" })).toHaveTextContent("398,000원");
  },
};
